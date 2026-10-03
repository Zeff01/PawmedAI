from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from notifications.models import PushSubscription

User = get_user_model()

SUBSCRIPTION = {
    "endpoint": "https://push.example.com/abc",
    "keys": {"p256dh": "key", "auth": "secret"},
}


@override_settings(ALLOWED_HOSTS=["testserver"])
class PushSubscribeTests(TestCase):
    def test_a_signed_in_subscriber_owns_the_device(self):
        user = User.objects.create_user(username="owner", password="x")
        client = APIClient()
        client.force_authenticate(user)

        response = client.post("/api/push/subscribe/", SUBSCRIPTION, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(PushSubscription.objects.get().user, user)

    def test_a_visitor_can_still_subscribe(self):
        response = APIClient().post("/api/push/subscribe/", SUBSCRIPTION, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertIsNone(PushSubscription.objects.get().user)

    def test_a_signed_out_resubscribe_keeps_the_owner(self):
        user = User.objects.create_user(username="owner", password="x")
        client = APIClient()
        client.force_authenticate(user)
        client.post("/api/push/subscribe/", SUBSCRIPTION, format="json")

        APIClient().post("/api/push/subscribe/", SUBSCRIPTION, format="json")

        self.assertEqual(PushSubscription.objects.get().user, user)
