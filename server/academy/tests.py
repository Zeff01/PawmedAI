"""The academy's rules, pinned down.

These cover the things a student would notice if they broke: that answers are
not leaked before they are earned, that stages open in order, that a second try
is worth less than a first, and that points and progress add up.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from academy.models import Case, CaseAttempt, CaseOption, CaseStage
from users.models import UserProfile

User = get_user_model()


def build_case(slug="test-case", stage_count=2):
    case = Case.objects.create(
        slug=slug,
        title="Test case",
        species=Case.Species.CANINE,
        discipline="Internal Medicine",
        difficulty=Case.Difficulty.BEGINNER,
        body_system="Test",
        presentation="A test patient.",
        completion_bonus=30,
    )
    for order in range(1, stage_count + 1):
        stage = CaseStage.objects.create(
            case=case,
            order=order,
            kind=CaseStage.Kind.DIAGNOSIS,
            title=f"Stage {order}",
            prompt="Pick one.",
            select_mode=CaseStage.SelectMode.SINGLE,
            points=10,
            explanation=f"Because of reason {order}.",
        )
        CaseOption.objects.create(stage=stage, order=1, label="Right", is_correct=True)
        CaseOption.objects.create(stage=stage, order=2, label="Wrong", is_correct=False)
    return case


def build_multi_case(slug="multi-case"):
    """A case whose one stage takes several answers — three right, two wrong."""
    case = Case.objects.create(
        slug=slug,
        title="Multi case",
        species=Case.Species.CANINE,
        discipline="Emergency & Critical Care",
        difficulty=Case.Difficulty.INTERMEDIATE,
        body_system="Test",
        presentation="A test patient.",
        completion_bonus=30,
    )
    stage = CaseStage.objects.create(
        case=case,
        order=1,
        kind=CaseStage.Kind.HISTORY,
        title="Triage",
        prompt="Pick every finding that applies.",
        select_mode=CaseStage.SelectMode.MULTI,
        points=10,
        explanation="Because of these three findings.",
    )
    for order in range(1, 4):
        CaseOption.objects.create(
            stage=stage, order=order, label=f"Right {order}", is_correct=True
        )
    for order in range(4, 6):
        CaseOption.objects.create(
            stage=stage, order=order, label=f"Wrong {order}", is_correct=False
        )
    return case, stage


def make_user(username, user_type):
    user = User.objects.create_user(username=username, password="x")
    UserProfile.objects.create(user=user, user_type=user_type)
    return user


@override_settings(ALLOWED_HOSTS=["testserver"])
class AcademyAccessTests(TestCase):
    def setUp(self):
        self.case = build_case()
        self.client = APIClient()

    def test_anonymous_callers_are_refused(self):
        response = self.client.get("/api/academy/cases/")
        self.assertIn(response.status_code, (401, 403))

    def test_professionals_are_refused(self):
        self.client.force_authenticate(
            make_user("vet", UserProfile.UserType.PROFESSIONAL)
        )
        response = self.client.get("/api/academy/cases/")
        self.assertEqual(response.status_code, 403)

    def test_students_are_allowed(self):
        self.client.force_authenticate(
            make_user("student", UserProfile.UserType.STUDENT)
        )
        response = self.client.get("/api/academy/cases/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)


@override_settings(ALLOWED_HOSTS=["testserver"])
class CaseDetailTests(TestCase):
    def setUp(self):
        self.case = build_case()
        self.student = make_user("student", UserProfile.UserType.STUDENT)
        self.client = APIClient()
        self.client.force_authenticate(self.student)

    def test_options_never_carry_the_answer(self):
        response = self.client.get(f"/api/academy/cases/{self.case.slug}/")
        for stage in response.data["stages"]:
            for option in stage["options"]:
                self.assertNotIn("is_correct", option)

    def test_answer_and_explanation_are_withheld_until_cleared(self):
        response = self.client.get(f"/api/academy/cases/{self.case.slug}/")
        first = response.data["stages"][0]
        self.assertIsNone(first["student"]["correct_option_ids"])
        self.assertIsNone(first["student"]["explanation"])

    def test_later_stages_start_locked(self):
        response = self.client.get(f"/api/academy/cases/{self.case.slug}/")
        stages = response.data["stages"]
        self.assertFalse(stages[0]["locked"])
        self.assertTrue(stages[1]["locked"])


@override_settings(ALLOWED_HOSTS=["testserver"])
class AnsweringTests(TestCase):
    def setUp(self):
        self.case = build_case()
        self.stages = list(self.case.stages.all())
        self.student = make_user("student", UserProfile.UserType.STUDENT)
        self.client = APIClient()
        self.client.force_authenticate(self.student)

    def answer(self, stage, correct=True):
        option = stage.options.get(is_correct=correct)
        return self.client.post(
            f"/api/academy/cases/{self.case.slug}/stages/{stage.id}/answer/",
            {"selected_option_ids": [option.id]},
            format="json",
        )

    def test_a_right_first_answer_scores_full_points(self):
        response = self.answer(self.stages[0])
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_correct"])
        self.assertEqual(response.data["points_earned"], 10)
        self.assertEqual(response.data["progress"]["percent"], 50)

    def test_clearing_a_stage_releases_the_explanation(self):
        response = self.answer(self.stages[0])
        self.assertEqual(response.data["explanation"], "Because of reason 1.")
        self.assertEqual(
            response.data["correct_option_ids"],
            [self.stages[0].options.get(is_correct=True).id],
        )

    def test_a_wrong_answer_scores_nothing_and_keeps_the_answer_hidden(self):
        response = self.answer(self.stages[0], correct=False)
        self.assertFalse(response.data["is_correct"])
        self.assertEqual(response.data["points_earned"], 0)
        self.assertIsNone(response.data["correct_option_ids"])
        self.assertIsNone(response.data["explanation"])
        self.assertEqual(response.data["tries_left"], 2)

    def test_a_second_try_is_worth_half(self):
        self.answer(self.stages[0], correct=False)
        response = self.answer(self.stages[0])
        self.assertTrue(response.data["is_correct"])
        self.assertEqual(response.data["points_earned"], 5)

    def test_the_answer_is_revealed_after_three_wrong_tries(self):
        self.answer(self.stages[0], correct=False)
        self.answer(self.stages[0], correct=False)
        response = self.answer(self.stages[0], correct=False)

        self.assertFalse(response.data["is_correct"])
        self.assertTrue(response.data["revealed"])
        self.assertTrue(response.data["cleared"])
        self.assertEqual(response.data["points_earned"], 0)
        # Revealed still unlocks the next stage — a stuck student is never
        # walled into a case they cannot leave.
        self.assertIsNotNone(response.data["correct_option_ids"])
        self.assertEqual(response.data["progress"]["percent"], 50)

    def test_stages_cannot_be_answered_out_of_order(self):
        response = self.answer(self.stages[1])
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "stage_locked")

    def test_a_cleared_stage_cannot_be_re_answered(self):
        self.answer(self.stages[0])
        response = self.answer(self.stages[0])
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "stage_cleared")

    def test_a_clean_run_earns_the_completion_bonus(self):
        self.answer(self.stages[0])
        response = self.answer(self.stages[1])

        self.assertTrue(response.data["progress"]["completed"])
        self.assertEqual(response.data["completion_bonus"], 30)
        self.assertEqual(response.data["case_points"], 10 + 10 + 30)

    def test_a_revealed_stage_costs_the_completion_bonus(self):
        for _ in range(3):
            self.answer(self.stages[0], correct=False)
        response = self.answer(self.stages[1])

        self.assertTrue(response.data["progress"]["completed"])
        self.assertEqual(response.data["completion_bonus"], 0)
        self.assertEqual(response.data["case_points"], 10)

    def test_a_single_answer_stage_rejects_two_selections(self):
        stage = self.stages[0]
        response = self.client.post(
            f"/api/academy/cases/{self.case.slug}/stages/{stage.id}/answer/",
            {
                "selected_option_ids": [
                    option.id for option in stage.options.all()
                ]
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_options_from_another_stage_are_rejected(self):
        foreign = self.stages[1].options.first()
        response = self.client.post(
            f"/api/academy/cases/{self.case.slug}/stages/{self.stages[0].id}/answer/",
            {"selected_option_ids": [foreign.id]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_one_students_progress_is_invisible_to_another(self):
        self.answer(self.stages[0])

        other = make_user("other", UserProfile.UserType.STUDENT)
        client = APIClient()
        client.force_authenticate(other)
        response = client.get(f"/api/academy/cases/{self.case.slug}/")

        self.assertFalse(response.data["progress"]["started"])
        self.assertIsNone(response.data["stages"][0]["student"]["explanation"])


@override_settings(ALLOWED_HOSTS=["testserver"])
class ProgressTests(TestCase):
    def setUp(self):
        self.case = build_case()
        self.stages = list(self.case.stages.all())
        self.student = make_user("student", UserProfile.UserType.STUDENT)
        self.client = APIClient()
        self.client.force_authenticate(self.student)

    def answer(self, stage, correct=True):
        option = stage.options.get(is_correct=correct)
        return self.client.post(
            f"/api/academy/cases/{self.case.slug}/stages/{stage.id}/answer/",
            {"selected_option_ids": [option.id]},
            format="json",
        )

    def test_an_untouched_student_reports_zeroes_not_nulls(self):
        response = self.client.get("/api/academy/progress/")
        self.assertEqual(response.data["points"], 0)
        self.assertEqual(response.data["cases_completed"], 0)
        self.assertEqual(response.data["streak_days"], 0)
        # No answers means accuracy is unknown, not zero — a student who has
        # not answered anything has not got anything wrong.
        self.assertIsNone(response.data["accuracy"])

    def test_points_and_completions_accumulate(self):
        self.answer(self.stages[0])
        self.answer(self.stages[1])

        response = self.client.get("/api/academy/progress/")
        self.assertEqual(response.data["points"], 50)
        self.assertEqual(response.data["cases_completed"], 1)
        self.assertEqual(response.data["accuracy"], 100.0)
        self.assertEqual(response.data["streak_days"], 1)

    def test_accuracy_counts_first_attempts_only(self):
        self.answer(self.stages[0], correct=False)
        self.answer(self.stages[0])
        self.answer(self.stages[1])

        response = self.client.get("/api/academy/progress/")
        # Two stages answered, one of them right first time.
        self.assertEqual(response.data["accuracy"], 50.0)

    def test_resetting_a_case_keeps_the_points_already_banked(self):
        self.answer(self.stages[0])
        self.client.post(f"/api/academy/cases/{self.case.slug}/reset/")

        attempt = CaseAttempt.objects.get(user=self.student, case=self.case)
        self.assertEqual(attempt.points_earned, 10)
        self.assertEqual(attempt.stage_attempts.count(), 0)
        self.assertIsNone(attempt.completed_at)


@override_settings(ALLOWED_HOSTS=["testserver"])
class PartialCreditTests(TestCase):
    """Several-answer stages pay for the reasoning that got part of the way.

    The rule: each right pick earns its share of the stage, each wrong pick
    cancels one out, and a stage keeps whatever its best attempt was worth.
    """

    def setUp(self):
        self.case, self.stage = build_multi_case()
        self.options = list(self.stage.options.all())
        self.right = [o for o in self.options if o.is_correct]
        self.wrong = [o for o in self.options if not o.is_correct]
        self.student = make_user("student", UserProfile.UserType.STUDENT)
        self.client = APIClient()
        self.client.force_authenticate(self.student)

    def pick(self, *options):
        return self.client.post(
            f"/api/academy/cases/{self.case.slug}/stages/{self.stage.id}/answer/",
            {"selected_option_ids": [option.id for option in options]},
            format="json",
        )

    def test_two_of_three_right_earns_two_thirds_of_the_stage(self):
        response = self.pick(*self.right[:2])

        self.assertFalse(response.data["is_correct"])
        self.assertTrue(response.data["partial_credit"])
        self.assertEqual(response.data["points_earned"], 7)
        self.assertEqual(response.data["stage_points_earned"], 7)
        # Part right is not right: the stage stays open and the answer is
        # still withheld.
        self.assertFalse(response.data["cleared"])
        self.assertIsNone(response.data["correct_option_ids"])
        self.assertEqual(response.data["tries_left"], 2)

    def test_a_wrong_pick_cancels_out_a_right_one(self):
        response = self.pick(self.right[0], self.right[1], self.wrong[0])

        self.assertTrue(response.data["partial_credit"])
        self.assertEqual(response.data["points_earned"], 3)

    def test_ticking_every_box_does_not_earn_full_marks(self):
        response = self.pick(*self.options)

        self.assertFalse(response.data["is_correct"])
        self.assertEqual(response.data["points_earned"], 3)

    def test_more_wrong_than_right_earns_nothing(self):
        response = self.pick(self.right[0], *self.wrong)

        self.assertFalse(response.data["partial_credit"])
        self.assertEqual(response.data["points_earned"], 0)
        self.assertEqual(response.data["stage_points_earned"], 0)

    def test_a_stage_keeps_the_best_attempt_and_is_never_paid_twice(self):
        first = self.pick(*self.right[:2])
        self.assertEqual(first.data["points_earned"], 7)

        # A weaker second answer banks nothing new, and takes nothing away.
        second = self.pick(self.right[0], self.wrong[0])
        self.assertEqual(second.data["points_earned"], 0)
        self.assertEqual(second.data["stage_points_earned"], 7)

        attempt = CaseAttempt.objects.get(user=self.student, case=self.case)
        self.assertEqual(attempt.points_earned, 7)

    def test_getting_it_right_after_partial_credit_tops_up_to_the_best(self):
        self.pick(*self.right[:2])
        response = self.pick(*self.right)

        self.assertTrue(response.data["is_correct"])
        self.assertTrue(response.data["cleared"])
        # A second try is worth 5, but 7 was already earned — points already
        # banked are never taken away.
        self.assertEqual(response.data["points_earned"], 0)
        self.assertEqual(response.data["stage_points_earned"], 7)
        # Correct without ever being shown the answer, so the clean-run bonus
        # still lands: 7 for the stage plus 30 for the case.
        self.assertEqual(response.data["completion_bonus"], 30)
        self.assertEqual(response.data["case_points"], 37)

    def test_partial_credit_survives_the_answer_being_revealed(self):
        self.pick(*self.right[:2])
        self.pick(self.right[0], self.wrong[0])
        response = self.pick(self.wrong[0], self.wrong[1])

        self.assertTrue(response.data["revealed"])
        self.assertTrue(response.data["cleared"])
        self.assertEqual(response.data["stage_points_earned"], 7)
        # Revealed still costs the clean-run bonus.
        self.assertEqual(response.data["completion_bonus"], 0)
        self.assertTrue(response.data["progress"]["completed"])

    def test_partial_credit_is_reported_on_the_case_after_a_reload(self):
        self.pick(*self.right[:2])

        response = self.client.get(f"/api/academy/cases/{self.case.slug}/")
        state = response.data["stages"][0]["student"]
        self.assertEqual(state["points_earned"], 7)
        self.assertFalse(state["cleared"])
        self.assertIsNone(state["explanation"])

    def test_a_part_right_answer_is_not_first_time_right(self):
        self.pick(*self.right[:2])
        self.pick(*self.right)

        response = self.client.get("/api/academy/progress/")
        # 7 for the part-right stage it was cleared on, plus the 30-point bonus.
        self.assertEqual(response.data["points"], 37)
        # One stage answered, cleared on the second go — accuracy is
        # first-time-right, so it stays at zero.
        self.assertEqual(response.data["accuracy"], 0.0)

    def test_a_single_answer_stage_is_still_all_or_nothing(self):
        case = build_case(slug="single-answer-case", stage_count=1)
        stage = case.stages.first()
        response = self.client.post(
            f"/api/academy/cases/{case.slug}/stages/{stage.id}/answer/",
            {"selected_option_ids": [stage.options.get(is_correct=False).id]},
            format="json",
        )

        self.assertFalse(response.data["partial_credit"])
        self.assertEqual(response.data["points_earned"], 0)
