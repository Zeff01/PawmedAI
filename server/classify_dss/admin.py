from django.contrib import admin

from classify_dss.models import ClassificationRecord, FeedbackReminder


@admin.register(ClassificationRecord)
class ClassificationRecordAdmin(admin.ModelAdmin):
    """Where the feedback gets read: filter by verdict, role, model or prompt
    version to see how the AI is doing and where it goes wrong."""

    list_display = (
        "created_at",
        "kind",
        "diagnosis",
        "animal_type",
        "confidence",
        "verdict",
        "actual_diagnosis",
        "confirmed_by",
        "mode",
        "shared",
    )
    list_filter = (
        "kind",
        "verdict",
        "outcome",
        "mode",
        "confirmed_by",
        "shared",
        "model_name",
        "prompt_version",
        "animal_type",
    )
    search_fields = ("diagnosis", "actual_diagnosis", "animal_type")
    date_hierarchy = "created_at"
    readonly_fields = [field.name for field in ClassificationRecord._meta.fields]

    def has_add_permission(self, request):
        return False


@admin.register(FeedbackReminder)
class FeedbackReminderAdmin(admin.ModelAdmin):
    list_display = ("record", "user", "remind_at", "notified_at", "created_at")
    list_filter = ("notified_at",)
    raw_id_fields = ("record", "user")
