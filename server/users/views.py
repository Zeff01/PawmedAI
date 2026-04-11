from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

import requests as http_requests
from django.conf import settings

from .authentication import SupabaseJWTAuthentication
from .models import UserProfile
from .serializers import (
    GoogleCodeExchangeSerializer,
    OAuthCallbackSerializer,
    UserSerializer,
    UserTypeSerializer,
)


class OAuthCallbackView(APIView):
    """
    Receives the Supabase access_token from the frontend after OAuth
    (Google or GitHub) completes the redirect flow.
    Validates the JWT, syncs the user to Django, and returns the user profile.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = OAuthCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token: str = serializer.validated_data["access_token"]
        auth = SupabaseJWTAuthentication()

        try:
            payload = auth._decode_token(token)
        except AuthenticationFailed as exc:
            return Response(
                {"detail": str(exc.detail)},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = auth._get_or_create_user(payload)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class GoogleCodeExchangeView(APIView):
    """
    Exchanges a Google authorization code for tokens.
    Returns the id_token so the frontend can call
    supabase.auth.signInWithIdToken() and keep Supabase in sync.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

    def post(self, request: Request) -> Response:
        serializer = GoogleCodeExchangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["code"]
        redirect_uri = serializer.validated_data["redirect_uri"]

        client_id = settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_CLIENT_SECRET

        if not client_id or not client_secret:
            return Response(
                {"detail": "Google OAuth is not configured on the server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        token_resp = http_requests.post(
            self.GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )

        if token_resp.status_code != 200:
            return Response(
                {"detail": "Failed to exchange authorization code with Google."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tokens = token_resp.json()
        id_token = tokens.get("id_token")
        if not id_token:
            return Response(
                {"detail": "No id_token returned from Google."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"id_token": id_token}, status=status.HTTP_200_OK)


class MeView(APIView):
    """Returns the profile of the currently authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(UserSerializer(request.user).data)


class UserTypeView(APIView):
    """Sets the user's profile type once."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = UserTypeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.user_type:
            return Response(
                {"detail": "Profile type is already set."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.user_type = serializer.validated_data["user_type"]
        profile.save(update_fields=["user_type", "updated_at"])

        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
