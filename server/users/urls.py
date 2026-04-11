from django.urls import path
from .views import GoogleCodeExchangeView, MeView, OAuthCallbackView, UserTypeView

urlpatterns = [
    path("auth/callback/", OAuthCallbackView.as_view(), name="oauth-callback"),
    path("auth/google/exchange/", GoogleCodeExchangeView.as_view(), name="google-code-exchange"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/user-type/", UserTypeView.as_view(), name="user-type"),
]
