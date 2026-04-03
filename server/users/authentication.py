import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientConnectionError

from .models import UserProfile

User = get_user_model()


class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Authenticates requests using a Supabase-issued JWT.
    Automatically creates or syncs a local Django User on first login.
    """
    _jwk_client: PyJWKClient | None = None

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        payload = self._decode_token(token)
        user = self._get_or_create_user(payload)
        return user, token

    def _decode_token(self, token: str) -> dict:
        try:
            # Prefer JWKS / RS256 when available (Supabase default).
            if settings.SUPABASE_JWKS_URL:
                if self._jwk_client is None:
                    headers = None
                    if settings.SUPABASE_ANON_KEY:
                        headers = {
                            "apikey": settings.SUPABASE_ANON_KEY,
                            "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
                        }
                    try:
                        self.__class__._jwk_client = PyJWKClient(
                            settings.SUPABASE_JWKS_URL,
                            headers=headers,
                            timeout=5,
                        )
                    except TypeError:
                        # Fallback for PyJWT versions without headers/timeout support.
                        self.__class__._jwk_client = PyJWKClient(
                            settings.SUPABASE_JWKS_URL
                        )
                try:
                    signing_key = self._jwk_client.get_signing_key_from_jwt(token)
                except PyJWKClientConnectionError as exc:
                    raise AuthenticationFailed(
                        "Unable to fetch Supabase JWKS. Check SUPABASE_URL or "
                        "SUPABASE_JWKS_URL."
                    ) from exc
                return jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                )

            # Fall back to HS256 with the JWT secret (legacy Supabase setup).
            secret = settings.SUPABASE_JWT_SECRET
            if secret:
                return jwt.decode(
                    token,
                    secret,  # raw string, not decoded bytes
                    algorithms=["HS256"],
                    audience="authenticated",
                    options={"verify_aud": True},
                )

            raise AuthenticationFailed(
                "Missing SUPABASE_URL/SUPABASE_JWKS_URL or SB_JWT_SECRET configuration."
            )

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired.")
        except jwt.InvalidAudienceError:
            raise AuthenticationFailed("Invalid token audience.")
        except jwt.InvalidTokenError as exc:
            raise AuthenticationFailed(f"Invalid token: {exc}")

    def _get_or_create_user(self, payload: dict) -> User:
        supabase_uid: str = payload.get("sub", "")
        if not supabase_uid:
            raise AuthenticationFailed("Token is missing 'sub' claim.")

        email: str = payload.get("email", "")
        metadata: dict = payload.get("user_metadata", {})
        full_name: str = metadata.get("full_name", "") or metadata.get("name", "")
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user, created = User.objects.get_or_create(
            username=supabase_uid,
            defaults={
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
            },
        )

        if not created and user.email != email:
            user.email = email
            user.save(update_fields=["email"])

        UserProfile.objects.get_or_create(user=user)
        return user
