from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    user_type = serializers.CharField(source="profile.user_type", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "user_type"]
        read_only_fields = ["id", "username", "email", "first_name", "last_name", "user_type"]


class OAuthCallbackSerializer(serializers.Serializer):
    """Validates the Supabase access_token POSTed from the frontend."""
    access_token = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={"blank": "access_token must not be empty."},
    )


class UserTypeSerializer(serializers.Serializer):
    user_type = serializers.ChoiceField(choices=UserProfile.UserType.choices)
