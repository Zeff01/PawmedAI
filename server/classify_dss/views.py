import json
import logging

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from classify_dss.serializers import (
    DiseaseClassificationRequestSerializer,
    DiseaseClassificationResponseSerializer,
)
from classify_dss.services.disease_classifier import DiseaseClassifier
from classify_dss.throttles import DiseaseClassificationIPThrottle

logger = logging.getLogger(__name__)

class DiseaseClassificationAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [DiseaseClassificationIPThrottle]

    def post(self, request):
        request_serializer = DiseaseClassificationRequestSerializer(
            data=request.data
        )
        if not request_serializer.is_valid():
            return Response(
                request_serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_image = request_serializer.validated_data["image"]
        mode = request_serializer.validated_data.get("mode", "professional")
        try:
            classifier = DiseaseClassifier()
            result = classifier.classify(image_file=uploaded_image, mode=mode)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except Exception as exc:
            logger.exception("Disease classification failed.")
            return Response(
                {
                    "detail": "Failed to classify the image.",
                    "error": str(exc) or repr(exc),
                    "error_type": exc.__class__.__name__,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_serializer = DiseaseClassificationResponseSerializer(data=result)
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
