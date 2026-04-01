import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Authenticates requests using a Supabase-issued JWT.
    Automatically creates or syncs a local Django User on first login.
    """

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
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
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

        return user