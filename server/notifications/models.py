from django.conf import settings
from django.db import models


class PushSubscription(models.Model):
    endpoint = models.URLField(max_length=2048, unique=True)
    # Set when a signed-in user subscribes, so a reminder can reach their own
    # devices instead of every subscriber. Empty for visitors.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="push_subscriptions",
    )
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    user_agent = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.endpoint
