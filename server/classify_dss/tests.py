import uuid
from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from classify_dss.models import ClassificationRecord, FeedbackReminder
from classify_dss.views import _serialize_and_respond

User = get_user_model()

PROFESSIONAL_RESULT = {
    "animal_type": "dog",
    "disease_name": "Atopic dermatitis",
    "short_description": "Itchy skin.",
    "clinical_diagnosis": "Pruritus with alopecia.",
    "possible_causes": ["Environmental allergens"],
    "symptoms": ["Itching"],
    "recommended_treatment": "Itch control.",
    "confidence": 82,
}

PHOTO = "https://ucarecdn.com/0b3c6f6e-0000-4000-8000-000000000000/dog.jpg"


class ClassificationRecordTests(TestCase):
    def test_a_valid_answer_is_recorded_without_inputs(self):
        response = _serialize_and_respond(
            dict(PROFESSIONAL_RESULT), "professional", had_image=True, had_notes=False
        )

        record = ClassificationRecord.objects.get(pk=response.data["feedback_id"])
        self.assertEqual(record.diagnosis, "Atopic dermatitis")
        self.assertEqual(record.confidence, 82)
        self.assertTrue(record.had_image)
        self.assertFalse(record.had_notes)
        self.assertEqual(record.shared_image_url, "")
        self.assertEqual(record.shared_notes, "")

    def test_an_invalid_answer_is_not_recorded(self):
        response = _serialize_and_respond({"disease_name": "x"}, "professional")

        self.assertEqual(response.status_code, 502)
        self.assertFalse(ClassificationRecord.objects.exists())


@override_settings(ALLOWED_HOSTS=["testserver"])
class ClassificationFeedbackTests(TestCase):
    def setUp(self):
        self.record = ClassificationRecord.objects.create(
            mode="professional",
            outcome=ClassificationRecord.Outcome.DIAGNOSTIC,
            diagnosis="Atopic dermatitis",
        )
        self.client = APIClient()
        self.client.force_authenticate(
            User.objects.create_user(username="vet", password="x")
        )

    def url(self, record_id=None):
        return f"/api/classification-feedback/{record_id or self.record.pk}/"

    def test_anonymous_callers_are_refused(self):
        response = APIClient().post(self.url(), {"verdict": "correct"}, format="json")
        self.assertIn(response.status_code, (401, 403))

    def test_feedback_is_saved_without_inputs_unless_shared(self):
        response = self.client.post(
            self.url(),
            {
                "verdict": "incorrect",
                "actual_diagnosis": "Sarcoptic mange",
                "confirmed_by": "lab_test",
                "image_url": PHOTO,
                "notes": "Itchy ears",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.record.refresh_from_db()
        self.assertEqual(self.record.verdict, "incorrect")
        self.assertEqual(self.record.actual_diagnosis, "Sarcoptic mange")
        self.assertEqual(self.record.confirmed_by, "lab_test")
        self.assertIsNotNone(self.record.feedback_at)
        self.assertFalse(self.record.shared)
        self.assertEqual(self.record.shared_image_url, "")
        self.assertEqual(self.record.shared_notes, "")

    def test_shared_feedback_keeps_the_photo_and_notes(self):
        self.client.post(
            self.url(),
            {"verdict": "correct", "share": True, "image_url": PHOTO, "notes": "Itchy"},
            format="json",
        )

        self.record.refresh_from_db()
        self.assertTrue(self.record.shared)
        self.assertEqual(self.record.shared_image_url, PHOTO)
        self.assertEqual(self.record.shared_notes, "Itchy")

    def test_withdrawing_consent_clears_what_was_shared(self):
        self.client.post(
            self.url(),
            {"verdict": "correct", "share": True, "image_url": PHOTO, "notes": "Itchy"},
            format="json",
        )
        self.client.post(self.url(), {"verdict": "correct"}, format="json")

        self.record.refresh_from_db()
        self.assertFalse(self.record.shared)
        self.assertEqual(self.record.shared_image_url, "")
        self.assertEqual(self.record.shared_notes, "")

    def test_only_uploadcare_photos_are_accepted(self):
        response = self.client.post(
            self.url(),
            {
                "verdict": "correct",
                "share": True,
                "image_url": "https://example.com/dog.jpg",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_unknown_records_are_not_found(self):
        response = self.client.post(
            self.url(uuid.uuid4()), {"verdict": "correct"}, format="json"
        )
        self.assertEqual(response.status_code, 404)


@override_settings(ALLOWED_HOSTS=["testserver"])
class FeedbackReminderTests(TestCase):
    def setUp(self):
        self.record = ClassificationRecord.objects.create(
            mode="fur_parent",
            outcome=ClassificationRecord.Outcome.DIAGNOSTIC,
            diagnosis="Atopic dermatitis",
        )
        self.owner = User.objects.create_user(username="owner", password="x")
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def feedback(self, **body):
        return self.client.post(
            f"/api/classification-feedback/{self.record.pk}/", body, format="json"
        )

    def test_unsure_with_remind_me_creates_a_reminder(self):
        response = self.feedback(verdict="unsure", remind_me=True)

        self.assertTrue(response.data["reminder"])
        reminder = FeedbackReminder.objects.get(record=self.record)
        self.assertEqual(reminder.user, self.owner)
        self.assertGreater(reminder.remind_at, timezone.now() + timedelta(days=2))

    def test_unsure_without_remind_me_links_nothing(self):
        self.feedback(verdict="unsure")
        self.assertFalse(FeedbackReminder.objects.exists())

    def test_a_real_answer_settles_the_reminder(self):
        self.feedback(verdict="unsure", remind_me=True)
        self.feedback(verdict="correct", confirmed_by="vet_exam")
        self.assertFalse(FeedbackReminder.objects.exists())

    def test_only_due_reminders_are_listed(self):
        FeedbackReminder.objects.create(
            record=self.record, user=self.owner, remind_at=timezone.now()
        )
        later = ClassificationRecord.objects.create(
            mode="fur_parent", outcome="diagnostic", diagnosis="Later"
        )
        FeedbackReminder.objects.create(
            record=later, user=self.owner, remind_at=timezone.now() + timedelta(days=1)
        )

        response = self.client.get("/api/feedback-reminders/")

        self.assertEqual([item["diagnosis"] for item in response.data], ["Atopic dermatitis"])

    def test_someone_elses_reminder_is_hidden(self):
        FeedbackReminder.objects.create(
            record=self.record, user=self.owner, remind_at=timezone.now()
        )
        stranger = APIClient()
        stranger.force_authenticate(User.objects.create_user(username="s", password="x"))

        response = stranger.get(f"/api/feedback-reminders/{self.record.pk}/")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(stranger.get("/api/feedback-reminders/").data, [])

    def test_dismissing_deletes_the_reminder(self):
        FeedbackReminder.objects.create(
            record=self.record, user=self.owner, remind_at=timezone.now()
        )
        response = self.client.delete(f"/api/feedback-reminders/{self.record.pk}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(FeedbackReminder.objects.exists())

    @patch("classify_dss.management.commands.send_feedback_reminders.send_to_user")
    def test_due_reminders_are_pushed_once(self, send_to_user):
        send_to_user.return_value = 1
        FeedbackReminder.objects.create(
            record=self.record, user=self.owner, remind_at=timezone.now()
        )

        call_command("send_feedback_reminders", stdout=StringIO())
        call_command("send_feedback_reminders", stdout=StringIO())

        send_to_user.assert_called_once()
        self.assertEqual(
            send_to_user.call_args.kwargs["url"], f"/classify/feedback/{self.record.pk}"
        )
        self.assertIsNotNone(FeedbackReminder.objects.get().notified_at)
