from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id", "username", "email", "first_name", "last_name"]


class OAuthCallbackSerializer(serializers.Serializer):
    """Validates the Supabase access_token POSTed from the frontend."""
    access_token = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={"blank": "access_token must not be empty."},
    )