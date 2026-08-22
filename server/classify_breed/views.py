import json
import logging

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from classify_breed.serializers import (
    BreedClassificationRequestSerializer,
    BreedClassificationResponseSerializer,
)
from classify_breed.services.breed_classifier import BreedClassifier
from classify_dss.throttles import DiseaseClassificationIPThrottle

logger = logging.getLogger(__name__)


class BreedClassificationAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [DiseaseClassificationIPThrottle]
    permission_classes = [AllowAny]

    def _is_unauthenticated_image_request(self, request) -> bool:
        return bool(request.FILES.get("image")) and not request.user.is_authenticated

    def check_throttles(self, request):
        if self._is_unauthenticated_image_request(request):
            return
        super().check_throttles(request)

    def post(self, request):
        if self._is_unauthenticated_image_request(request):
            return Response(
                {
                    "detail": (
                        "Sign in to identify a breed from a photo. You can still "
                        "identify your pet by describing it, without an account."
                    ),
                    "code": "image_requires_auth",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        request_serializer = BreedClassificationRequestSerializer(data=request.data)
        if not request_serializer.is_valid():
            return Response(
                request_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_image = request_serializer.validated_data.get("image")
        description = request_serializer.validated_data.get("text", "")

        try:
            classifier = BreedClassifier()
            result = classifier.classify(
                image_file=uploaded_image, text_input=description
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except Exception as exc:
            logger.exception("Breed classification failed.")
            return Response(
                {
                    "detail": "Failed to classify the breed.",
                    "error": str(exc) or repr(exc),
                    "error_type": exc.__class__.__name__,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = BreedClassificationResponseSerializer(data=result)
        if not response_serializer.is_valid():
            return Response(
                {
                    "detail": "AI response did not match the expected schema.",
                    "raw_response": json.dumps(result, ensure_ascii=False),
                    "errors": response_serializer.errors,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(response_serializer.data, status=status.HTTP_200_OK)
