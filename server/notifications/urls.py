from django.urls import path

from notifications.views import (
    PushSendTestView,
    PushSubscribeView,
    PushUnsubscribeView,
    VapidPublicKeyView,
)

urlpatterns = [
    path("vapid-public-key/", VapidPublicKeyView.as_view(), name="vapid-public-key"),
    path("subscribe/", PushSubscribeView.as_view(), name="push-subscribe"),
    path("unsubscribe/", PushUnsubscribeView.as_view(), name="push-unsubscribe"),
    path("send-test/", PushSendTestView.as_view(), name="push-send-test"),
]
