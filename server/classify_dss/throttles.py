from zoneinfo import ZoneInfo

import logging

from django.conf import settings
from django.core.cache import caches
from django.utils import timezone
from rest_framework.exceptions import Throttled
from rest_framework.throttling import SimpleRateThrottle

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
            # If Redis is down, fall back to local memory cache to keep limits.
            logger.exception("Throttle cache unavailable; using fallback cache.")
            try:
                self.cache = caches["throttle_fallback"]
                return super().allow_request(request, view)
            except Exception:
                logger.exception("Throttle fallback cache failed; rejecting request.")
                raise Throttled(
                    detail="Rate limiter unavailable. Please try again later."
                )
