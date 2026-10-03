from django.urls import path

from classify_dss.views import (
    ClassificationFeedbackAPIView,
    ClassificationQuotaAPIView,
    FeedbackReminderDetailAPIView,
    FeedbackReminderListAPIView,
    DiseaseClassificationAPIView,
)


urlpatterns = [
    path("disease-classify/", DiseaseClassificationAPIView.as_view(), name="disease-classify"),
    path("classify-quota/", ClassificationQuotaAPIView.as_view(), name="classify-quota"),
    path(
        "classification-feedback/<uuid:record_id>/",
        ClassificationFeedbackAPIView.as_view(),
        name="classification-feedback",
    ),
    path(
        "feedback-reminders/",
        FeedbackReminderListAPIView.as_view(),
        name="feedback-reminders",
    ),
    path(
        "feedback-reminders/<uuid:record_id>/",
        FeedbackReminderDetailAPIView.as_view(),
        name="feedback-reminder",
    ),
]
