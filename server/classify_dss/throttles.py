from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone
from rest_framework.throttling import SimpleRateThrottle


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
        
        # Reset every 10 hours in Asia/Manila (Philippine time)
        now = timezone.now().astimezone(ZoneInfo("Asia/Manila"))
        date_key = now.strftime("%Y%m%d")
        bucket = now.hour // 10
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{ident}:{date_key}:b{bucket}",
        }

    def allow_request(self, request, view):
        return super().allow_request(request, view)
