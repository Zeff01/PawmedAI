from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from classify_breed.views import BreedClassificationAPIView
from classify_dss.models import ClassificationRecord

User = get_user_model()

RESULT = {
    "animal_type": "dog",
    "breed_name": "Beagle",
    "confidence": 88,
    "description": "A scent hound.",
    "temperament": ["Friendly"],
    "common_traits": ["Tricolour coat"],
    "care_tips": ["Daily walks"],
}


@override_settings(ALLOWED_HOSTS=["testserver"])
@patch.object(BreedClassificationAPIView, "throttle_classes", [])
@patch("classify_breed.views.BreedClassifier")
class BreedRecordTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(User.objects.create_user(username="u", password="x"))

    def classify(self, classifier, result):
        classifier.return_value.classify.return_value = result
        return self.client.post(
            "/api/breed-classify/",
            {"text": "Small tricolour hound with long ears"},
            format="json",
        )

    def test_a_breed_answer_is_recorded_for_feedback(self, classifier):
        response = self.classify(classifier, dict(RESULT))

        record = ClassificationRecord.objects.get(pk=response.data["feedback_id"])
        self.assertEqual(record.kind, ClassificationRecord.Kind.BREED)
        self.assertEqual(record.diagnosis, "Beagle")
        self.assertEqual(record.confidence, 88)
        self.assertFalse(record.had_image)
        self.assertTrue(record.had_notes)

    def test_an_unidentified_animal_is_recorded_as_such(self, classifier):
        response = self.classify(
            classifier, {**RESULT, "breed_name": "Unknown", "not_identified": True}
        )

        record = ClassificationRecord.objects.get(pk=response.data["feedback_id"])
        self.assertEqual(record.outcome, ClassificationRecord.Outcome.NOT_IDENTIFIED)
        self.assertEqual(record.diagnosis, "")
