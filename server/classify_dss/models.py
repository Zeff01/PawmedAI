from django.conf import settings
from django.db import models


class ClassificationThrottleMeta(models.Model):
    scope = models.CharField(max_length=64)
    ident = models.CharField(max_length=255)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    user_first_name = models.CharField(max_length=150, blank=True)
    last_seen_ph = models.DateTimeField()
    next_reset_ph = models.DateTimeField()
    bucket_hours = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("scope", "ident")
        indexes = [
            models.Index(fields=["scope", "ident"]),
        ]

    def __str__(self):
        return f"{self.scope}:{self.ident}"
