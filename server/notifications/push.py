"""Sending web push. One place for the VAPID details and for pruning
subscriptions the browser has given up on."""

import json
import logging

from django.conf import settings
from pywebpush import WebPushException, webpush

from notifications.models import PushSubscription

logger = logging.getLogger(__name__)


def deliver(subscriptions, *, title: str, body: str, url: str = "/") -> tuple[int, int]:
    """Push one message to each subscription. Returns (attempted, failed).

    A 404 or 410 means the browser has dropped the subscription for good, so
    it is deleted rather than retried forever.
    """
    if not settings.VAPID_PRIVATE_KEY:
        raise RuntimeError("VAPID private key is not configured.")

    payload = json.dumps({"title": title, "body": body, "url": url or "/"})
    attempted = failed = 0
    for subscription in subscriptions:
        attempted += 1
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
            )
        except WebPushException as exc:
            failed += 1
            if getattr(exc.response, "status_code", None) in {404, 410}:
                subscription.delete()
            logger.warning("Web push failed: %s", exc)
    return attempted, failed


def send_to_user(user, *, title: str, body: str, url: str = "/") -> int:
    """Push to every device the user has turned notifications on for.

    Returns how many devices it reached; zero when they have none, which is
    normal — not everyone allows notifications.
    """
    subscriptions = list(PushSubscription.objects.filter(user=user))
    if not subscriptions:
        return 0
    attempted, failed = deliver(subscriptions, title=title, body=body, url=url)
    return attempted - failed
