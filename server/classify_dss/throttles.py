from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone
from rest_framework.throttling import SimpleRateThrottle

import logging

logger = logging.getLogger(__name__)


class DiseaseClassificationIPThrottle(SimpleRateThrottle):
    scope = "disease_classify"

    def get_ident(self, request):
        if getattr(settings, "THROTTLE_TRUST_X_FORWARDED_FOR", False):
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                return x_forwarded_for.split(",")[0].strip()
        return super().get_ident(request)

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        if not ident:
            return None
        # Reset at midnight Asia/Manila (Philippine time)
        now = timezone.now().astimezone(ZoneInfo("Asia/Manila"))
        date_key = now.strftime("%Y%m%d")
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{ident}:{date_key}",
        }

    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:
            # If cache is down (e.g., Redis connection error), fail open.
            logger.exception("Throttle cache unavailable; allowing request.")
            return True
