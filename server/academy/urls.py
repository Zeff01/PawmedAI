from django.urls import path

from academy.views import (
    CaseDetailAPIView,
    CaseListAPIView,
    CaseResetAPIView,
    StageAnswerAPIView,
    StudentProgressAPIView,
)

urlpatterns = [
    path("cases/", CaseListAPIView.as_view(), name="academy-case-list"),
    path(
        "cases/<slug:slug>/",
        CaseDetailAPIView.as_view(),
        name="academy-case-detail",
    ),
    path(
        "cases/<slug:slug>/stages/<int:stage_id>/answer/",
        StageAnswerAPIView.as_view(),
        name="academy-stage-answer",
    ),
    path(
        "cases/<slug:slug>/reset/",
        CaseResetAPIView.as_view(),
        name="academy-case-reset",
    ),
    path(
        "progress/",
        StudentProgressAPIView.as_view(),
        name="academy-progress",
    ),
]
