from rest_framework import serializers

from notifications.models import PushSubscription


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


class UnsubscribeSerializer(serializers.Serializer):
    endpoint = serializers.URLField()


class SendTestNotificationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=120)
    body = serializers.CharField(max_length=240)
    url = serializers.CharField(max_length=512, required=False, allow_blank=True)
