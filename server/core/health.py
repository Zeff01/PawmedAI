import os

from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone


def health_check(request):
    return JsonResponse(
        {
            "status": "ok",
            "time": timezone.now().isoformat(),
        }
    )


def cache_health_check(request):
    backend = f"{cache.__class__.__module__}.{cache.__class__.__name__}"
    key = "health:cache_check"
    cache_ok = True
    cache_error = None
    try:
        cache.set(key, "ok", timeout=30)
        cache_ok = cache.get(key) == "ok"
    except Exception as exc:
        cache_ok = False
        cache_error = exc.__class__.__name__

    return JsonResponse(
        {
            "status": "ok" if cache_ok else "degraded",
            "time": timezone.now().isoformat(),
            "cache_backend": backend,
            "cache_ok": cache_ok,
            "cache_error": cache_error,
            "redis_url_set": bool(os.getenv("REDIS_URL")),
        }
    )
