from django.urls import path

from classify_dss.views import (
    ClassificationQuotaAPIView,
    DiseaseClassificationAPIView,
)


urlpatterns = [
    path("disease-classify/", DiseaseClassificationAPIView.as_view(), name="disease-classify"),
    path("classify-quota/", ClassificationQuotaAPIView.as_view(), name="classify-quota"),
]
