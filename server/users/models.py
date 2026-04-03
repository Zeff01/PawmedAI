from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class UserType(models.TextChoices):
        STUDENT = "student", "Veterinary Student"
        PROFESSIONAL = "professional", "Veterinary Professional"
        FUR_PARENT = "fur_parent", "Fur Parent"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    user_type = models.CharField(
        max_length=32,
        choices=UserType.choices,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user_id} - {self.user_type or 'unset'}"
