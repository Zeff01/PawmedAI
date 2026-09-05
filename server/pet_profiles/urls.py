from django.urls import path

from pet_profiles.views import (
    AppointmentAPIView,
    AppointmentDetailAPIView,
    DashboardAPIView,
    MedicationDetailAPIView,
    MedicationDoseAPIView,
    MedicationListCreateAPIView,
    PetDetailAPIView,
    PetDocumentAPIView,
    PetListCreateAPIView,
    VaccinationAPIView,
    VaccinationDetailAPIView,
    WeightEntryAPIView,
)

urlpatterns = [
    path("dashboard/", DashboardAPIView.as_view(), name="fp-dashboard"),
    path("", PetListCreateAPIView.as_view(), name="fp-pets"),
    path("<int:pk>/", PetDetailAPIView.as_view(), name="fp-pet-detail"),
    path(
        "<int:pet_id>/weights/",
        WeightEntryAPIView.as_view(),
        name="fp-pet-weights",
    ),
    path(
        "<int:pet_id>/vaccinations/",
        VaccinationAPIView.as_view(),
        name="fp-pet-vaccinations",
    ),
    path(
        "<int:pet_id>/medications/",
        MedicationListCreateAPIView.as_view(),
        name="fp-pet-medications",
    ),
    path(
        "<int:pet_id>/appointments/",
        AppointmentAPIView.as_view(),
        name="fp-pet-appointments",
    ),
    path(
        "<int:pet_id>/documents/",
        PetDocumentAPIView.as_view(),
        name="fp-pet-documents",
    ),
    path(
        "vaccinations/<int:pk>/",
        VaccinationDetailAPIView.as_view(),
        name="fp-vaccination-detail",
    ),
    path(
        "medications/<int:pk>/",
        MedicationDetailAPIView.as_view(),
        name="fp-medication-detail",
    ),
    path(
        "appointments/<int:pk>/",
        AppointmentDetailAPIView.as_view(),
        name="fp-appointment-detail",
    ),
    path(
        "medications/<int:medication_id>/doses/",
        MedicationDoseAPIView.as_view(),
        name="fp-medication-doses",
    ),
]
