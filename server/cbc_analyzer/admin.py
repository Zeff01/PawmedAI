from django.contrib import admin

from cbc_analyzer.models import MedicalLog, Pet


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("name", "species", "breed", "owner_name", "user", "created_at")
    list_filter = ("species", "sex", "neuter_status")
    search_fields = ("name", "owner_name", "breed")
    autocomplete_fields = ()


@admin.register(MedicalLog)
class MedicalLogAdmin(admin.ModelAdmin):
    list_display = (
        "record_id",
        "pet_name",
        "species",
        "test_date",
        "result_status",
        "flag_count",
        "user",
    )
    list_filter = ("result_status", "species", "test_date")
    search_fields = ("record_id", "pet_name", "owner_name", "breed")
    readonly_fields = ("record_id", "evaluation", "values", "created_at", "updated_at")
