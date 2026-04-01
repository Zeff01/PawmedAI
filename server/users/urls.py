from django.urls import path
from .views import MeView, OAuthCallbackView

urlpatterns = [
    path("auth/callback/", OAuthCallbackView.as_view(), name="oauth-callback"),
    path("auth/me/", MeView.as_view(), name="me"),
]