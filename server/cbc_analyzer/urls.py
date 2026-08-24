from django.urls import path

from cbc_analyzer.views import (
    CBCAnalyzeAPIView,
    MedicalLogDetailAPIView,
    MedicalLogListCreateAPIView,
    MedicalLogSummaryAPIView,
    PetDetailAPIView,
    PetListCreateAPIView,
)

urlpatterns = [
    path("cbc/analyze/", CBCAnalyzeAPIView.as_view(), name="cbc-analyze"),
    path("cbc/pets/", PetListCreateAPIView.as_view(), name="cbc-pets"),
    path("cbc/pets/<int:pk>/", PetDetailAPIView.as_view(), name="cbc-pet-detail"),
    path("cbc/logs/", MedicalLogListCreateAPIView.as_view(), name="cbc-logs"),
    path(
        "cbc/logs/summary/",
        MedicalLogSummaryAPIView.as_view(),
        name="cbc-log-summary",
    ),
    path(
        "cbc/logs/<str:record_id>/",
        MedicalLogDetailAPIView.as_view(),
        name="cbc-log-detail",
    ),
]
