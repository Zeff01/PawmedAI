from django.urls import path

from classify_breed.views import BreedClassificationAPIView

urlpatterns = [
    path("breed-classify/", BreedClassificationAPIView.as_view(), name="breed-classify"),
]
