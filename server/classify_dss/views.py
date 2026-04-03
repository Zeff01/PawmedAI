import json
import logging

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
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


def _build_not_animal_response(mode: str, animal_type: str = "", reason: str = ""):
    """Return a structured response for images that contain no recognisable animal."""
    if mode == "fur_parent":
        details = (
            "This image does not look like a clear photo of a single pet with a visible issue."
        )
        if reason:
            details = f"{details} {reason}".strip()
        return {
            "animal_type": animal_type,
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
        "animal_type": animal_type,
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


def _build_healthy_response(mode: str, animal_type: str = "", reason: str = ""):
    """Return a structured response when the uploaded animal appears healthy."""
    species_label = animal_type.capitalize() if animal_type else "Animal"

    if mode == "fur_parent":
        return {
            "animal_type": animal_type,
            "possible_condition_name": "Healthy Animal",
            "what_we_noticed": (
                f"Your {species_label.lower()} looks healthy! "
                "There are no visible skin conditions, wounds, or other issues in this photo."
            ),
            "what_this_might_mean": (
                "This is great news! Based on what we can see, your pet appears to be "
                "in good shape. Keep up the wonderful care you are providing."
            ),
            "signs_to_watch_for": [
                "Changes in eating or drinking habits.",
                "Unusual scratching, licking, or biting at any area.",
                "Lethargy or changes in behaviour.",
                "Any new lumps, bumps, or skin changes.",
            ],
            "how_serious_does_it_look": "Nothing concerning is visible in this photo.",
            "what_you_can_do_right_now": [
                "Continue your regular grooming and hygiene routine.",
                "Keep fresh water available at all times.",
                "Schedule a routine wellness check-up with your vet.",
            ],
            "see_a_vet_because": (
                "Regular vet visits help catch any issues early, even when your pet looks perfectly healthy."
            ),
            "urgency": "routine checkup",
            "reassurance_note": (
                "You are doing a great job keeping an eye on your pet — "
                "vets are always happy to help keep them healthy and thriving!"
            ),
        }

    return {
        "animal_type": animal_type,
        "disease_name": "Healthy Animal",
        "short_description": (
            f"The {species_label.lower()} in this image appears healthy with no visible "
            "skin condition, wound, lesion, or other abnormality detected."
        ),
        "clinical_diagnosis": "No visible condition detected",
        "possible_causes": [],
        "symptoms": [],
        "recommended_treatment": (
            "No treatment required. Schedule a routine veterinary check-up to maintain good health."
        ),
        "confidence": 0,
        "additional_notes": reason or (
            "The animal appears healthy based on visual inspection. "
            "A physical examination by a veterinarian is recommended for a comprehensive assessment."
        ),
    }


def _serialize_and_respond(result: dict, mode: str):
    """Validate result dict with the appropriate serializer and return a DRF Response."""
    if mode == "fur_parent":
        response_serializer = FurParentClassificationResponseSerializer(data=result)
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


class DiseaseClassificationAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [DiseaseClassificationIPThrottle]
    permission_classes = [AllowAny]

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

            # ------------------------------------------------------------------
            # Step 1 — Image triage (only when an image is provided)
            # ------------------------------------------------------------------
            if uploaded_image:
                try:
                    triage_status, animal_type, reason = classifier.is_diagnostic_image(
                        uploaded_image
                    )
                finally:
                    try:
                        uploaded_image.seek(0)
                    except Exception:
                        pass

                if triage_status == "not_animal":
                    result = _build_not_animal_response(mode, animal_type, reason)
                    return _serialize_and_respond(result, mode)

                if triage_status == "healthy":
                    result = _build_healthy_response(mode, animal_type, reason)
                    return _serialize_and_respond(result, mode)

                # triage_status == "diagnostic" — fall through to classification
            else:
                animal_type = ""

            # ------------------------------------------------------------------
            # Step 2 — For derived modes, run a professional pass first to get
            #           a reliable reference diagnosis.
            # ------------------------------------------------------------------
            reference_diagnosis = None
            professional_result = None
            if mode in {"fur_parent", "student"}:
                try:
                    if uploaded_image:
                        uploaded_image.seek(0)
                    professional_result = classifier.classify(
                        image_file=uploaded_image,
                        text_input=notes,
                        mode="professional",
                    )
                    reference_diagnosis = professional_result.get("disease_name")
                    # Capture animal_type from the professional pass if not already set
                    if not animal_type:
                        animal_type = str(
                            professional_result.get("animal_type") or ""
                        ).strip().lower()
                except Exception:
                    logger.exception(
                        "Failed to fetch professional diagnosis for derived mode."
                    )

            if uploaded_image:
                uploaded_image.seek(0)

            # ------------------------------------------------------------------
            # Step 3 — Main classification call
            # ------------------------------------------------------------------
            result = classifier.classify(
                image_file=uploaded_image,
                text_input=notes,
                mode=mode,
                reference_diagnosis=reference_diagnosis,
            )

            # Ensure animal_type is always present in the result
            if not result.get("animal_type") and animal_type:
                result["animal_type"] = animal_type

            # ------------------------------------------------------------------
            # Step 4 — Mode-specific post-processing
            # ------------------------------------------------------------------
            if mode == "fur_parent" and reference_diagnosis:
                result["possible_condition_name"] = reference_diagnosis

            if mode == "student" and professional_result:
                # Merge student educational extras with professional core fields.
                merged = dict(result)
                for key in (
                    "animal_type",
                    "disease_name",
                    "short_description",
                    "clinical_diagnosis",
                    "possible_causes",
                    "symptoms",
                    "recommended_treatment",
                    "confidence",
                    "additional_notes",
                ):
                    if key in professional_result:
                        merged[key] = professional_result.get(key)
                result = merged

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

        return _serialize_and_respond(result, mode)
