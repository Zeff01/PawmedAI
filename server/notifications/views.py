import logging

from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from notifications.models import PushSubscription
from notifications.serializers import (
    PushSubscriptionSerializer,
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
    # Default authentication, so a signed-in caller's device is linked to them;
    # still open to visitors, whose devices stay unlinked.
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PushSubscriptionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user.is_authenticated else None
        serializer.save(user=user)
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
