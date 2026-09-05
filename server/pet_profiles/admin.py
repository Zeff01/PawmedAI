from django.contrib import admin

from pet_profiles.models import (
    Appointment,
    CareEvent,
    Medication,
    MedicationDose,
    Pet,
    PetDocument,
    Vaccination,
    WeightEntry,
)


class WeightEntryInline(admin.TabularInline):
    model = WeightEntry
    extra = 0


class VaccinationInline(admin.TabularInline):
    model = Vaccination
    extra = 0


class MedicationInline(admin.TabularInline):
    model = Medication
    extra = 0


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "species", "breed", "is_favourite")
    list_filter = ("species", "is_favourite", "indoor_only")
    search_fields = ("name", "breed", "owner__email", "microchip_number")
    autocomplete_fields = ("owner",)
    inlines = [WeightEntryInline, VaccinationInline, MedicationInline]


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ("name", "pet", "cadence", "next_due_on", "is_active")
    list_filter = ("cadence", "form", "is_active")
    search_fields = ("name", "pet__name")


@admin.register(MedicationDose)
class MedicationDoseAdmin(admin.ModelAdmin):
    list_display = ("medication", "given_at")
    search_fields = ("medication__name", "medication__pet__name")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("title", "pet", "starts_at", "clinic", "status")
    list_filter = ("status",)
    search_fields = ("title", "pet__name", "clinic")


@admin.register(PetDocument)
class PetDocumentAdmin(admin.ModelAdmin):
    list_display = ("label", "pet", "kind", "uploaded_at")
    list_filter = ("kind",)
    search_fields = ("label", "pet__name")


@admin.register(CareEvent)
class CareEventAdmin(admin.ModelAdmin):
    list_display = ("title", "pet", "kind", "occurred_at")
    list_filter = ("kind",)
    search_fields = ("title", "pet__name")


admin.site.register([Vaccination, WeightEntry])
