import logging
import re
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone
from rest_framework.throttling import SimpleRateThrottle

logger = logging.getLogger(__name__)


class AIRunThrottle(SimpleRateThrottle):
    """One allowance across every AI-generated result.

    Disease classification, breed identification, and CBC analysis all draw on
    the same bucket: a run is a run, whichever feature spends it. Applied by
    every view that calls a model, so "3 of 5 left" means the same thing
    everywhere in the app.

    The allowance belongs to a user. Generating requires an account, so an
    anonymous caller is refused by the permission layer before this meter is
    ever consulted — there is no IP-keyed bucket to fall back to.
    """

    scope = "ai_run_user"
    _bucket_hours: int | None = None
    _ident: str | None = None
    _user_first_name: str | None = None
    _rate_regex = re.compile(r"^(?P<num>\d+)/(?P<window>\d+)(?P<unit>[smhd])$")

    def get_ident(self, request):
        if getattr(settings, "THROTTLE_TRUST_X_FORWARDED_FOR", False):
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                return x_forwarded_for.split(",")[0].strip()
        return super().get_ident(request)

    def _resolve_scope_and_ident(self, request):
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            self._user_first_name = user.first_name or ""
            return "ai_run_user", f"user:{user.pk}", 5
        # No account, nothing to meter. Views that call a model require
        # authentication, so this is only reached by the read-only quota
        # endpoint asking what a visitor has — the answer is "sign in first".
        self._user_first_name = None
        return "ai_run_user", None, 5

    def get_cache_key(self, request, view):
        scope, ident, bucket_hours = self._resolve_scope_and_ident(request)
        if not ident:
            return None

        self.scope = scope
        self._ident = ident
        self._bucket_hours = bucket_hours

        # Bucket by hours in Asia/Manila (Philippine time)
        now = timezone.now().astimezone(ZoneInfo("Asia/Manila"))
        date_key = now.strftime("%Y%m%d")
        bucket = now.hour // bucket_hours
        return self.cache_format % {
            "scope": self.scope,
            "ident": f"{ident}:{date_key}:b{bucket}",
        }

    def parse_rate(self, rate):
        if not rate:
            return None, None

        match = self._rate_regex.match(rate)
        if match:
            num_requests = int(match.group("num"))
            window = int(match.group("window"))
            unit = match.group("unit")
            unit_seconds = {"s": 1, "m": 60, "h": 3600, "d": 86400}[unit]
            return num_requests, window * unit_seconds

        return super().parse_rate(rate)

    def get_rate(self):
        rates = getattr(settings, "REST_FRAMEWORK", {}).get(
            "DEFAULT_THROTTLE_RATES", {}
        )
        return rates.get(self.scope)

    def _next_reset(self):
        """When the current bucket rolls over, in Philippine time.

        The cache key rotates on this boundary, so it is also when the count
        goes back to zero — always sooner than the rate window elapsing.
        """
        now = timezone.now().astimezone(ZoneInfo("Asia/Manila"))
        bucket = now.hour // self._bucket_hours
        bucket_start = now.replace(
            hour=bucket * self._bucket_hours, minute=0, second=0, microsecond=0
        )
        return bucket_start + timezone.timedelta(hours=self._bucket_hours)

    def _write_meta(self):
        if not self._ident or not self._bucket_hours:
            return

        next_reset = self._next_reset()
        now = timezone.now().astimezone(ZoneInfo("Asia/Manila"))
        try:
            from django.apps import apps

            MetaModel = apps.get_model(
                "classify_dss", "ClassificationThrottleMeta"
            )
            user = getattr(self, "_user_obj", None)
            MetaModel.objects.update_or_create(
                scope=self.scope,
                ident=self._ident,
                defaults={
                    "user": user,
                    "user_first_name": self._user_first_name or "",
                    "last_seen_ph": now,
                    "next_reset_ph": next_reset,
                    "bucket_hours": self._bucket_hours,
                },
            )
        except Exception as exc:
            logger.warning("Throttle meta write failed: %s", exc)

    def allow_request(self, request, view):
        scope, ident, bucket_hours = self._resolve_scope_and_ident(request)
        self.scope = scope
        self._ident = ident
        self._user_obj = getattr(request, "user", None)
        self._bucket_hours = bucket_hours
        self.rate = self.get_rate()
        if self.rate:
            self.num_requests, self.duration = self.parse_rate(self.rate)
        allowed = super().allow_request(request, view)
        self._write_meta()
        return allowed
