# 3) Push Notifications (Server)

This section covers the Django server setup for push notifications.

---

## 3.1 Install Dependency

File: `server/requirements.txt`

```
pywebpush==2.0.3
```

---

## 3.2 Add App

File: `server/core/settings.py`

```py
INSTALLED_APPS = [
    'rest_framework',
    'classify_dss',
    'notifications',
    'corsheaders',
    ...
]
```

---

## 3.3 Routes

File: `server/core/urls.py`

```py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('classify_dss.urls')),
    path('api/push/', include('notifications.urls')),
    ...
]
```

---

## 3.4 Models

File: `server/notifications/models.py`

```py
from django.db import models

class PushSubscription(models.Model):
    endpoint = models.URLField(max_length=2048, unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    user_agent = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## 3.5 Serializer

File: `server/notifications/serializers.py`

```py
class PushSubscriptionSerializer(serializers.ModelSerializer):
    keys = serializers.DictField(write_only=True)

    class Meta:
        model = PushSubscription
        fields = ["endpoint", "keys", "user_agent"]

    def create(self, validated_data):
        keys = validated_data.pop("keys", {})
        p256dh = keys.get("p256dh")
        auth = keys.get("auth")

        instance, _ = PushSubscription.objects.update_or_create(
            endpoint=validated_data["endpoint"],
            defaults={
                "p256dh": p256dh or "",
                "auth": auth or "",
                "user_agent": validated_data.get("user_agent", ""),
            },
        )
        return instance
```

---

## 3.6 Views

File: `server/notifications/views.py`

```py
from pywebpush import WebPushException, webpush

class VapidPublicKeyView(APIView):
    def get(self, request):
        return Response({"publicKey": settings.VAPID_PUBLIC_KEY})

class PushSubscribeView(APIView):
    def post(self, request):
        serializer = PushSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": "subscribed"}, status=201)

class PushSendTestView(APIView):
    def post(self, request):
        payload = {
            "title": request.data.get("title"),
            "body": request.data.get("body"),
            "url": request.data.get("url") or "/",
        }
        for subscription in PushSubscription.objects.all():
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
                if getattr(exc.response, "status_code", None) in {404, 410}:
                    subscription.delete()
        return Response({"status": "sent"})
```

---

## 3.7 URLs

File: `server/notifications/urls.py`

```py
urlpatterns = [
    path("vapid-public-key/", VapidPublicKeyView.as_view()),
    path("subscribe/", PushSubscribeView.as_view()),
    path("unsubscribe/", PushUnsubscribeView.as_view()),
    path("send-test/", PushSendTestView.as_view()),
]
```

