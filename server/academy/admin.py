from django.contrib import admin

from academy.models import (
    Case,
    CaseAttempt,
    CaseOption,
    CaseStage,
    StageAttempt,
)


class CaseOptionInline(admin.TabularInline):
    model = CaseOption
    extra = 4


class CaseStageInline(admin.TabularInline):
    model = CaseStage
    extra = 0
    show_change_link = True
    fields = ["order", "kind", "title", "select_mode", "points"]


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "species",
        "difficulty",
        "discipline",
        "is_published",
        "order",
    ]
    list_filter = ["species", "difficulty", "is_published"]
    search_fields = ["title", "slug", "discipline", "body_system"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [CaseStageInline]


@admin.register(CaseStage)
class CaseStageAdmin(admin.ModelAdmin):
    list_display = ["case", "order", "kind", "title", "select_mode", "points"]
    list_filter = ["kind", "select_mode"]
    inlines = [CaseOptionInline]


class StageAttemptInline(admin.TabularInline):
    model = StageAttempt
    extra = 0
    readonly_fields = [
        "stage",
        "selected_option_ids",
        "is_correct",
        "revealed",
        "tries",
        "points_earned",
        "answered_at",
    ]
    can_delete = False


@admin.register(CaseAttempt)
class CaseAttemptAdmin(admin.ModelAdmin):
    list_display = ["user", "case", "points_earned", "completed_at", "updated_at"]
    list_filter = ["completed_at"]
    search_fields = ["user__username", "user__email", "case__title"]
    readonly_fields = ["user", "case", "points_earned", "completed_at"]
    inlines = [StageAttemptInline]
