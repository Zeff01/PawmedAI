"""Read a throttle's current window without spending a request against it.

Each AI feature is metered by its own DRF throttle, so "how many runs do I have
left" has one answer per feature, not one for the whole app. This turns any
`SimpleRateThrottle` into that answer.
"""

import logging

from django.utils import timezone

logger = logging.getLogger(__name__)


def read_quota(throttle, request):
    """Return the caller's remaining allowance under `throttle`, or None.

    Read-only on purpose: checking your allowance must never cost one of the
    runs it is reporting.
    """
    # Key first: a throttle whose scope depends on the caller (signed-in vs not)
    # resolves that inside `get_cache_key`, and `get_rate` reads it.
    cache_key = throttle.get_cache_key(request, None)

    rate = throttle.get_rate()
    if not rate:
        return None

    limit, duration = throttle.parse_rate(rate)
    if not limit:
        return None

    history = []
    if cache_key:
        try:
            history = throttle.cache.get(cache_key) or []
        except Exception as exc:
            logger.warning("Throttle quota read failed: %s", exc)

    now = throttle.timer()
    live = [stamp for stamp in history if stamp > now - duration]
    used = min(len(live), limit)

    return {
        "scope": throttle.scope,
        "limit": limit,
        "used": used,
        "remaining": max(limit - used, 0),
        "window_hours": round(duration / 3600, 2),
        "resets_at": _resets_at(throttle, live, duration, now),
    }


def _resets_at(throttle, live, duration, now):
    """When the next run frees up, as an ISO timestamp.

    A throttle that rotates its cache key on a fixed boundary says so itself via
    `_next_reset()`; for a plain sliding window it is the oldest live stamp
    ageing out, which is when one slot — not the whole allowance — comes back.
    """
    next_reset = getattr(throttle, "_next_reset", None)
    if callable(next_reset):
        return next_reset().isoformat()

    if not live:
        return None

    seconds_until = min(live) + duration - now
    return (
        timezone.now() + timezone.timedelta(seconds=max(seconds_until, 0))
    ).isoformat()
