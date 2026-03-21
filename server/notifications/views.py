import json
import logging

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from pywebpush import WebPushException, webpush

from notifications.models import PushSubscription
from notifications.serializers import (
    PushSubscriptionSerializer,
    SendTestNotificationSerializer,
    UnsubscribeSerializer,
)

logger = logging.getLogger(__name__)


class VapidPublicKeyView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not settings.VAPID_PUBLIC_KEY:
            return Response(
                {"detail": "VAPID public key is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({"publicKey": settings.VAPID_PUBLIC_KEY})


class PushSubscribeView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = PushSubscriptionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({"status": "subscribed"}, status=status.HTTP_201_CREATED)


class PushUnsubscribeView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = UnsubscribeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        PushSubscription.objects.filter(
            endpoint=serializer.validated_data["endpoint"]
        ).delete()
        return Response({"status": "unsubscribed"})


class PushSendTestView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not settings.VAPID_PRIVATE_KEY:
            return Response(
                {"detail": "VAPID private key is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = SendTestNotificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "title": serializer.validated_data["title"],
            "body": serializer.validated_data["body"],
            "url": serializer.validated_data.get("url") or "/",
        }

        subscriptions = list(PushSubscription.objects.all())
        failed = 0
        for subscription in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": subscription.endpoint,
                        "keys": {
                            "p256dh": subscription.p256dh,
                            "auth": subscription.auth,
                        },
                    },
                    data=json.dumps(payload),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": settings.VAPID_SUBJECT},
                )
            except WebPushException as exc:
                failed += 1
                status_code = getattr(exc.response, "status_code", None)
                if status_code in {404, 410}:
                    subscription.delete()
                logger.warning("Web push failed: %s", exc)

        return Response(
            {
                "status": "sent",
                "attempted": len(subscriptions),
                "failed": failed,
            }
        )
