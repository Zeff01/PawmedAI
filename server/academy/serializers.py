"""Serializers for the student case academy.

The one rule that matters here: `CaseOption.is_correct` never reaches the client
for a stage the student has not cleared. Options go out as id/label/detail only,
and the model answer is released by the answer endpoint — or, once a stage is
cleared, replayed through `correct_option_ids` so the student can review it.
"""

from rest_framework import serializers

from academy.models import Case, CaseOption, CaseStage


class CaseOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseOption
        fields = ["id", "label", "detail"]


class StageStudentStateSerializer(serializers.Serializer):
    """What this student has done with one stage."""

    answered = serializers.BooleanField()
    is_correct = serializers.BooleanField()
    revealed = serializers.BooleanField()
    cleared = serializers.BooleanField()
    tries = serializers.IntegerField()
    points_earned = serializers.IntegerField()
    selected_option_ids = serializers.ListField(child=serializers.IntegerField())
    # Both are null until the stage is cleared — releasing either one early
    # would hand over the answer.
    correct_option_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_null=True
    )
    explanation = serializers.CharField(allow_null=True)


class CaseStageSerializer(serializers.ModelSerializer):
    options = CaseOptionSerializer(many=True, read_only=True)
    student = serializers.SerializerMethodField()
    locked = serializers.SerializerMethodField()

    class Meta:
        model = CaseStage
        fields = [
            "id",
            "order",
            "kind",
            "title",
            "briefing",
            "prompt",
            "select_mode",
            "points",
            "options",
            "student",
            "locked",
        ]

    def _state(self, stage: CaseStage):
        return (self.context.get("stage_states") or {}).get(stage.id)

    def get_student(self, stage: CaseStage) -> dict:
        state = self._state(stage)
        if state is None:
            return {
                "answered": False,
                "is_correct": False,
                "revealed": False,
                "cleared": False,
                "tries": 0,
                "points_earned": 0,
                "selected_option_ids": [],
                "correct_option_ids": None,
                "explanation": None,
            }

        cleared = state.is_cleared
        return {
            "answered": True,
            "is_correct": state.is_correct,
            "revealed": state.revealed,
            "cleared": cleared,
            "tries": state.tries,
            "points_earned": state.points_earned,
            "selected_option_ids": list(state.selected_option_ids or []),
            "correct_option_ids": (
                sorted(stage.correct_option_ids()) if cleared else None
            ),
            "explanation": stage.explanation if cleared else None,
        }

    def get_locked(self, stage: CaseStage) -> bool:
        """A stage opens once every earlier stage of the case is cleared.

        Releasing the chemistry panel before the student has committed to a
        diagnostic plan would let them skip the reasoning the case is teaching.
        """
        cleared = self.context.get("cleared_stage_ids") or set()
        return any(
            earlier.id not in cleared
            for earlier in stage.case.stages.all()
            if earlier.order < stage.order
        )


class CaseListSerializer(serializers.ModelSerializer):
    """A case as it appears on the dashboard and in the library."""

    stage_count = serializers.SerializerMethodField()
    total_points = serializers.IntegerField(read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = [
            "slug",
            "title",
            "species",
            "discipline",
            "difficulty",
            "body_system",
            "presentation",
            "completion_bonus",
            "stage_count",
            "total_points",
            "progress",
        ]

    def get_stage_count(self, case: Case) -> int:
        return len(case.stages.all())

    def get_progress(self, case: Case) -> dict:
        attempt = (self.context.get("attempts_by_case") or {}).get(case.id)
        stages = list(case.stages.all())
        total = len(stages)

        if attempt is None:
            return {
                "started": False,
                "completed": False,
                "cleared_stages": 0,
                "total_stages": total,
                "percent": 0,
                "points_earned": 0,
                "current_stage_title": stages[0].title if stages else None,
                "last_active": None,
            }

        cleared = attempt.cleared_stage_ids()
        current = next(
            (stage for stage in stages if stage.id not in cleared), None
        )
        return {
            "started": True,
            "completed": attempt.completed_at is not None,
            "cleared_stages": len(cleared),
            "total_stages": total,
            "percent": round(len(cleared) / total * 100) if total else 0,
            "points_earned": attempt.points_earned,
            "current_stage_title": current.title if current else None,
            "last_active": attempt.updated_at,
        }


class CaseDetailSerializer(CaseListSerializer):
    stages = CaseStageSerializer(many=True, read_only=True)

    class Meta(CaseListSerializer.Meta):
        fields = CaseListSerializer.Meta.fields + ["stages"]


class AnswerSerializer(serializers.Serializer):
    """A student's submission for one stage."""

    selected_option_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        max_length=12,
    )

    def validate_selected_option_ids(self, value):
        stage: CaseStage = self.context["stage"]
        valid = {option.id for option in stage.options.all()}
        chosen = set(value)

        unknown = chosen - valid
        if unknown:
            raise serializers.ValidationError(
                "Those options do not belong to this stage."
            )

        if (
            stage.select_mode == CaseStage.SelectMode.SINGLE
            and len(chosen) != 1
        ):
            raise serializers.ValidationError(
                "This stage takes exactly one answer."
            )

        return sorted(chosen)
