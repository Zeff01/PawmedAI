from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework.throttling import SimpleRateThrottle


class DiseaseClassificationIPThrottle(SimpleRateThrottle):
    scope = "disease_classify"

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
