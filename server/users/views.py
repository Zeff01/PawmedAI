from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import SupabaseJWTAuthentication
from .serializers import OAuthCallbackSerializer, UserSerializer


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


class MeView(APIView):
    """Returns the profile of the currently authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(UserSerializer(request.user).data)