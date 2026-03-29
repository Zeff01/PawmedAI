import json
import logging

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from classify_dss.serializers import (
    DiseaseClassificationRequestSerializer,
    DiseaseClassificationResponseSerializer,
    FurParentClassificationResponseSerializer,
)
from classify_dss.services.disease_classifier import DiseaseClassifier
from classify_dss.throttles import DiseaseClassificationIPThrottle

logger = logging.getLogger(__name__)

def _build_non_animal_response(mode: str, reason: str = ""):
    if mode == "fur_parent":
        details = (
            "This image does not look like a clear photo of a single pet with a visible issue."
        )
        if reason:
            details = f"{details} {reason}".strip()
        return {
            "possible_condition_name": "Not an animal",
            "what_we_noticed": details,
            "what_this_might_mean": (
                "We need a clear, close-up photo of the specific area you are concerned about."
            ),
            "signs_to_watch_for": [],
            "how_serious_does_it_look": "We cannot assess this image.",
            "what_you_can_do_right_now": [
                "Upload a clear photo of a single pet.",
                "Make sure the affected area is in focus and well lit.",
            ],
            "see_a_vet_because": (
                "A vet can examine your pet in person if you are worried."
            ),
            "urgency": "routine checkup",
            "reassurance_note": (
                "You are doing the right thing by checking in and seeking help."
            ),
        }

    details = (
        "This image does not show a single animal patient with a visible condition."
    )
    if reason:
        details = f"{details} {reason}".strip()
    return {
        "disease_name": "Not an animal",
        "short_description": details,
        "clinical_diagnosis": "No animal detected",
        "possible_causes": [],
        "symptoms": [],
        "recommended_treatment": (
            "Please upload a clear close-up image of the affected area."
        ),
        "additional_notes": "Unable to classify without a usable patient image.",
    }

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

        uploaded_image = request_serializer.validated_data.get("image")
        notes = request_serializer.validated_data.get("text", "")
        mode = request_serializer.validated_data.get("mode", "professional")
        try:
            classifier = DiseaseClassifier()
            if uploaded_image:
                try:
                    is_diagnostic, reason = classifier.is_diagnostic_image(
                        uploaded_image
                    )
                finally:
                    try:
                        uploaded_image.seek(0)
                    except Exception:
                        pass

                if not is_diagnostic:
                    result = _build_non_animal_response(mode, reason)
                    if mode == "fur_parent":
                        response_serializer = (
                            FurParentClassificationResponseSerializer(data=result)
                        )
                    else:
                        response_serializer = DiseaseClassificationResponseSerializer(
                            data=result
                        )
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

            reference_diagnosis = None
            if mode == "fur_parent":
                try:
                    if uploaded_image:
                        uploaded_image.seek(0)
                    clinical_result = classifier.classify(
                        image_file=uploaded_image,
                        text_input=notes,
                        mode="professional",
                    )
                    reference_diagnosis = clinical_result.get("disease_name")
                except Exception:
                    logger.exception(
                        "Failed to fetch professional diagnosis for fur parent mode."
                    )

            if uploaded_image:
                uploaded_image.seek(0)

            result = classifier.classify(
                image_file=uploaded_image,
                text_input=notes,
                mode=mode,
                reference_diagnosis=reference_diagnosis,
            )
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

        if mode == "fur_parent":
            response_serializer = FurParentClassificationResponseSerializer(
                data=result
            )
        else:
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
