from django.urls import path

from classify_dss.views import DiseaseClassificationAPIView


urlpatterns = [
    path("disease-classify/", DiseaseClassificationAPIView.as_view(), name="disease-classify"),
]
