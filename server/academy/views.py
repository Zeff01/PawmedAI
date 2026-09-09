"""The student case academy API.

Every endpoint is scoped to the signed-in student: cases carry model answers, and
points are a personal record, so there is no anonymous or cross-user read here.
"""

import logging
from datetime import timedelta

from django.db import transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from academy.models import Case, CaseAttempt, CaseStage, StageAttempt
from academy.permissions import IsVeterinaryStudent
from academy.scoring import (
    TRIES_BEFORE_REVEAL,
    award_for,
    credited_fraction,
    should_reveal,
)
from academy.serializers import (
    AnswerSerializer,
    CaseDetailSerializer,
    CaseListSerializer,
)

logger = logging.getLogger(__name__)


def published_cases():
    """Cases with their stages and options, ready to serialize without N+1."""
    return (
        Case.objects.filter(is_published=True)
        .prefetch_related(
            Prefetch(
                "stages",
                queryset=CaseStage.objects.prefetch_related("options"),
            )
        )
        .order_by("order", "id")
    )


def attempts_for(user, cases=None):
    """The user's attempts keyed by case id, with stage answers preloaded."""
    queryset = CaseAttempt.objects.filter(user=user).prefetch_related(
        "stage_attempts"
    )
    if cases is not None:
        queryset = queryset.filter(case__in=cases)
    return {attempt.case_id: attempt for attempt in queryset}


class CaseListAPIView(APIView):
    """Every published case, with this student's progress folded in."""

    permission_classes = [IsVeterinaryStudent]

    def get(self, request):
        cases = list(published_cases())
        serializer = CaseListSerializer(
            cases,
            many=True,
            context={"attempts_by_case": attempts_for(request.user, cases)},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class CaseDetailAPIView(APIView):
    """One case, its stages, and where the student has got to."""

    permission_classes = [IsVeterinaryStudent]

    def get(self, request, slug):
        case = get_object_or_404(published_cases(), slug=slug)
        attempt = attempts_for(request.user, [case]).get(case.id)

        stage_states = (
            {
                stage_attempt.stage_id: stage_attempt
                for stage_attempt in attempt.stage_attempts.all()
            }
            if attempt
            else {}
        )

        serializer = CaseDetailSerializer(
            case,
            context={
                "attempts_by_case": {case.id: attempt} if attempt else {},
                "stage_states": stage_states,
                "cleared_stage_ids": (
                    attempt.cleared_stage_ids() if attempt else set()
                ),
            },
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class StageAnswerAPIView(APIView):
    """Submit an answer for one stage and find out how it scored."""

    permission_classes = [IsVeterinaryStudent]

    @transaction.atomic
    def post(self, request, slug, stage_id):
        case = get_object_or_404(published_cases(), slug=slug)
        stage = get_object_or_404(
            CaseStage.objects.prefetch_related("options"),
            pk=stage_id,
            case=case,
        )

        serializer = AnswerSerializer(
            data=request.data, context={"stage": stage}
        )
        serializer.is_valid(raise_exception=True)
        chosen = set(serializer.validated_data["selected_option_ids"])

        attempt, _ = CaseAttempt.objects.get_or_create(
            user=request.user, case=case
        )

        # Stages open in order: answering out of turn would skip the reasoning
        # the earlier stage exists to teach.
        cleared = attempt.cleared_stage_ids()
        blocked = [
            earlier
            for earlier in case.stages.all()
            if earlier.order < stage.order and earlier.id not in cleared
        ]
        if blocked:
            return Response(
                {
                    "detail": (
                        "Finish the earlier stages of this case first."
                    ),
                    "code": "stage_locked",
                },
                status=status.HTTP_409_CONFLICT,
            )

        stage_attempt, _ = StageAttempt.objects.get_or_create(
            attempt=attempt, stage=stage
        )

        if stage_attempt.is_cleared:
            return Response(
                {
                    "detail": "You have already cleared this stage.",
                    "code": "stage_cleared",
                },
                status=status.HTTP_409_CONFLICT,
            )

        stage_attempt.tries += 1
        stage_attempt.selected_option_ids = sorted(chosen)
        correct_ids = stage.correct_option_ids()
        is_correct = chosen == correct_ids

        # A part-right answer to a several-answer stage earns its share of the
        # stage rather than nothing: the reasoning that found three of the four
        # findings is worth crediting even though the answer is not yet right.
        fraction = 1.0 if is_correct else credited_fraction(chosen, correct_ids)
        worth = award_for(stage.points, stage_attempt.tries, fraction)

        # Only ever top up. The stage keeps whatever its best attempt was
        # worth, so a student is never charged for trying again — and cannot be
        # paid twice for the same finding either.
        banked = stage_attempt.points_earned
        awarded = max(0, worth - banked)

        if is_correct:
            stage_attempt.is_correct = True
        elif should_reveal(stage_attempt.tries):
            # Out of tries. Hand over the answer so the case can continue. It
            # costs the completion bonus, but any partial credit already earned
            # on the way stays earned.
            stage_attempt.revealed = True

        stage_attempt.points_earned = banked + awarded
        stage_attempt.save()

        if awarded:
            attempt.points_earned += awarded
            attempt.save(update_fields=["points_earned", "updated_at"])
        else:
            attempt.save(update_fields=["updated_at"])

        bonus = attempt.refresh_completion()

        cleared_now = attempt.cleared_stage_ids()
        total_stages = len(case.stages.all())
        revealed = stage_attempt.revealed
        next_stage = next(
            (s for s in case.stages.all() if s.id not in cleared_now), None
        )

        return Response(
            {
                "is_correct": is_correct,
                "revealed": revealed,
                "cleared": stage_attempt.is_cleared,
                "tries": stage_attempt.tries,
                "tries_left": max(0, TRIES_BEFORE_REVEAL - stage_attempt.tries),
                "points_earned": awarded,
                # Part-right, and told apart from plain wrong so the student
                # is shown what the attempt earned rather than a bare "not
                # quite". Judged on what the answer was worth, not on what it
                # topped up: a second, weaker part-right answer is still part
                # right even though it banks nothing new.
                "partial_credit": not is_correct and worth > 0,
                "stage_points_earned": stage_attempt.points_earned,
                "completion_bonus": bonus,
                "case_points": attempt.points_earned,
                # Released only once the stage is settled, one way or the other.
                "correct_option_ids": (
                    sorted(correct_ids) if stage_attempt.is_cleared else None
                ),
                "explanation": (
                    stage.explanation if stage_attempt.is_cleared else None
                ),
                "progress": {
                    "cleared_stages": len(cleared_now),
                    "total_stages": total_stages,
                    "percent": (
                        round(len(cleared_now) / total_stages * 100)
                        if total_stages
                        else 0
                    ),
                    "completed": attempt.completed_at is not None,
                    "next_stage_id": next_stage.id if next_stage else None,
                },
            },
            status=status.HTTP_200_OK,
        )


class CaseResetAPIView(APIView):
    """Start a case over.

    Points already banked stay banked — this clears the working state so the
    case can be re-run for revision, not so it can be farmed: a re-run of a
    completed case awards nothing further.
    """

    permission_classes = [IsVeterinaryStudent]

    @transaction.atomic
    def post(self, request, slug):
        case = get_object_or_404(published_cases(), slug=slug)
        attempt = CaseAttempt.objects.filter(
            user=request.user, case=case
        ).first()
        if attempt:
            attempt.stage_attempts.all().delete()
            attempt.completed_at = None
            attempt.save(update_fields=["completed_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentProgressAPIView(APIView):
    """The figures on the dashboard tiles, from the student's own attempts."""

    permission_classes = [IsVeterinaryStudent]

    def get(self, request):
        attempts = list(
            CaseAttempt.objects.filter(user=request.user).prefetch_related(
                "stage_attempts"
            )
        )
        stage_answers = [
            stage_attempt
            for attempt in attempts
            for stage_attempt in attempt.stage_attempts.all()
        ]

        answered = len(stage_answers)
        first_try = sum(1 for s in stage_answers if s.first_try_correct)
        completed = [a for a in attempts if a.completed_at]

        published_total = Case.objects.filter(is_published=True).count()

        return Response(
            {
                "points": sum(attempt.points_earned for attempt in attempts),
                "cases_completed": len(completed),
                "cases_in_progress": sum(
                    1
                    for attempt in attempts
                    if attempt.completed_at is None
                    and attempt.stage_attempts.all()
                ),
                "cases_available": published_total,
                "completed_this_week": sum(
                    1
                    for attempt in completed
                    if attempt.completed_at
                    >= timezone.now() - timedelta(days=7)
                ),
                "stages_answered": answered,
                # First-time-right over answers given. A stage you got on the
                # third go is a stage you got wrong twice, and the figure says
                # so — otherwise accuracy would only ever climb.
                "accuracy": (
                    round(first_try / answered * 100, 1) if answered else None
                ),
                "streak_days": _streak_days(stage_answers),
            },
            status=status.HTTP_200_OK,
        )


def _streak_days(stage_answers) -> int:
    """Consecutive days, ending today or yesterday, with at least one answer.

    Yesterday still counts so a streak is not lost to the hour someone happens
    to open the app; it breaks on the first clear day of silence.
    """
    if not stage_answers:
        return 0

    days = {
        timezone.localtime(s.answered_at).date()
        for s in stage_answers
        if s.answered_at
    }
    if not days:
        return 0

    today = timezone.localdate()
    cursor = today if today in days else today - timedelta(days=1)
    if cursor not in days:
        return 0

    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak
