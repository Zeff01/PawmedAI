import os
from urllib.parse import urlparse

from django.conf import settings
from django.core.cache import cache, caches
from django.http import JsonResponse
from django.utils import timezone

from classify_dss.throttles import DiseaseClassificationIPThrottle


def health_check(request):
    return JsonResponse(
        {
            "status": "ok",
            "time": timezone.now().isoformat(),
        }
    )


def cache_health_check(request):
    default_cache = caches["default"]
    backend = (
        f"{default_cache.__class__.__module__}."
        f"{default_cache.__class__.__name__}"
    )
    redis_url = os.getenv("REDIS_URL") or ""
    parsed = urlparse(redis_url) if redis_url else None
    key = "health:cache_check"
    cache_ok = True
    cache_error = None
    cache_error_detail = None
    try:
        cache.set(key, "ok", timeout=30)
        cache_ok = cache.get(key) == "ok"
    except Exception as exc:
        cache_ok = False
        cache_error = exc.__class__.__name__
        cache_error_detail = str(exc) or repr(exc)

    return JsonResponse(
        {
            "status": "ok" if cache_ok else "degraded",
            "time": timezone.now().isoformat(),
            "cache_backend": backend,
            "cache_ok": cache_ok,
            "cache_error": cache_error,
            "cache_error_detail": cache_error_detail,
            "redis_url_set": bool(os.getenv("REDIS_URL")),
            "redis_tls": parsed.scheme == "rediss" if parsed else None,
            "redis_host": parsed.hostname if parsed else None,
            "redis_port": parsed.port if parsed else None,
        }
    )


def throttle_health_check(request):
    if not settings.DEBUG and not os.getenv("DJANGO_HEALTH_DEBUG"):
        return JsonResponse({"detail": "Not found."}, status=404)

    throttle = DiseaseClassificationIPThrottle()
    cache_key = throttle.get_cache_key(request, None)
    throttle_count = None
    cache_error = None
    try:
        throttle_count = cache.get(cache_key) if cache_key else None
    except Exception as exc:
        cache_error = exc.__class__.__name__

    return JsonResponse(
        {
            "status": "ok",
            "time": timezone.now().isoformat(),
            "client_ident": throttle.get_ident(request),
            "cache_key": cache_key,
            "throttle_count": throttle_count,
            "cache_error": cache_error,
        }
    )
