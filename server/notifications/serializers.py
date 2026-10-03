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

        defaults = {
            "p256dh": p256dh or "",
            "auth": auth or "",
            "user_agent": validated_data.get("user_agent", ""),
        }
        # Claim the device for whoever is signed in; a signed-out re-subscribe
        # leaves an existing owner in place rather than orphaning the device.
        user = validated_data.get("user")
        if user is not None:
            defaults["user"] = user
        instance, _ = PushSubscription.objects.update_or_create(
            endpoint=validated_data["endpoint"],
            defaults=defaults,
        )
        return instance


class UnsubscribeSerializer(serializers.Serializer):
    endpoint = serializers.URLField()
