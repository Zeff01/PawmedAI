import json
import logging

from datetime import timedelta

from django.utils import timezone

from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from classify_dss.models import ClassificationRecord, FeedbackReminder
from classify_dss.records import record_classification
from classify_dss.serializers import (
    ClassificationFeedbackSerializer,
    DiseaseClassificationRequestSerializer,
    DiseaseClassificationResponseSerializer,
    FurParentClassificationResponseSerializer,
)
from classify_dss.services.disease_classifier import PROMPT_VERSION, DiseaseClassifier
from core.quotas import read_quota
from core.throttles import AIRunThrottle

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


def _serialize_and_respond(
    result: dict,
    mode: str,
    *,
    outcome: str = ClassificationRecord.Outcome.DIAGNOSTIC,
    had_image: bool = False,
    had_notes: bool = False,
):
    """Validate result dict with the appropriate serializer and return a DRF Response.

    A valid answer is recorded and comes back with a `feedback_id` the client
    uses to say whether the answer was right.
    """
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
    record = record_classification(
        kind=ClassificationRecord.Kind.DISEASE,
        mode=mode,
        outcome=outcome,
        prompt_version=PROMPT_VERSION,
        had_image=had_image,
        had_notes=had_notes,
        diagnosis=result.get("disease_name") or result.get("possible_condition_name"),
        animal_type=result.get("animal_type"),
        confidence=result.get("confidence"),
    )
    data = dict(response_serializer.data)
    data["feedback_id"] = str(record.id) if record else None
    return Response(data, status=status.HTTP_200_OK)


class ClassificationQuotaAPIView(APIView):
    """How many AI runs the caller has left in the current window.

    One figure for the whole app: CBC analyses, disease classifications, and
    breed identifications all spend from the same allowance. Read-only and
    unthrottled — checking must not cost a run.

    Open to visitors so the UI can say *why* the run button will not fire: an
    allowance belongs to an account, so someone signed out has none rather than
    an unknown one, and a zero limit is the honest way to say so.
    """

    permission_classes = [AllowAny]
    throttle_classes = []

    def get(self, request):
        user = getattr(request, "user", None)
        authenticated = bool(user and user.is_authenticated)

        if not authenticated:
            return Response(
                {
                    "authenticated": False,
                    "scope": "anonymous",
                    "limit": 0,
                    "used": 0,
                    "remaining": 0,
                    "window_hours": 0,
                    "resets_at": None,
                },
                status=status.HTTP_200_OK,
            )

        quota = read_quota(AIRunThrottle(), request) or {}
        return Response(
            {
                "authenticated": True,
                **quota,
            },
            status=status.HTTP_200_OK,
        )


class DiseaseClassificationAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    throttle_classes = [AIRunThrottle]
    permission_classes = [IsAuthenticated]

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
        inputs = {"had_image": bool(uploaded_image), "had_notes": bool(notes.strip())}

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
                    return _serialize_and_respond(
                        result,
                        mode,
                        outcome=ClassificationRecord.Outcome.NOT_ANIMAL,
                        **inputs,
                    )

                if triage_status == "healthy":
                    result = _build_healthy_response(mode, animal_type, reason)
                    return _serialize_and_respond(
                        result,
                        mode,
                        outcome=ClassificationRecord.Outcome.HEALTHY,
                        **inputs,
                    )

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

        return _serialize_and_respond(result, mode, **inputs)


# Long enough for a vet appointment, short enough that the visit is still fresh.
REMINDER_DELAY = timedelta(days=3)


def _reminder_payload(reminder: FeedbackReminder) -> dict:
    record = reminder.record
    return {
        "id": str(record.id),
        "kind": record.kind,
        "diagnosis": record.diagnosis,
        "animal_type": record.animal_type,
        "classified_at": record.created_at,
        "remind_at": reminder.remind_at,
    }


class ClassificationFeedbackAPIView(APIView):
    """The user's verdict on one classification.

    Addressed by the record's unguessable id, which only the person who ran the
    classification was given. Records carry no account link, so that id is the
    whole of the access check — and sending feedback again simply replaces it.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, record_id):
        record = ClassificationRecord.objects.filter(pk=record_id).first()
        if record is None:
            return Response(
                {"detail": "Classification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ClassificationFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        record.verdict = data["verdict"]
        record.actual_diagnosis = data.get("actual_diagnosis", "")
        record.confirmed_by = data.get("confirmed_by", "")
        record.shared = data.get("share", False)
        # Withdrawing consent on a resubmission clears what was shared before.
        record.shared_image_url = data.get("image_url", "") if record.shared else ""
        record.shared_notes = data.get("notes", "") if record.shared else ""
        record.feedback_at = timezone.now()
        record.save()

        # An answer settles the reminder; "not sure yet" keeps one only if asked.
        wants_reminder = data["verdict"] == ClassificationRecord.Verdict.UNSURE and data.get(
            "remind_me", False
        )
        if wants_reminder:
            FeedbackReminder.objects.update_or_create(
                record=record,
                defaults={
                    "user": request.user,
                    "remind_at": timezone.now() + REMINDER_DELAY,
                    "notified_at": None,
                },
            )
        else:
            FeedbackReminder.objects.filter(record=record).delete()

        return Response(
            {"saved": True, "reminder": wants_reminder}, status=status.HTTP_200_OK
        )


class FeedbackReminderListAPIView(APIView):
    """The caller's reminders that have come due — what the dashboard shows."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        reminders = FeedbackReminder.objects.filter(
            user=request.user, remind_at__lte=timezone.now()
        ).select_related("record")
        return Response([_reminder_payload(reminder) for reminder in reminders])


class FeedbackReminderDetailAPIView(APIView):
    """One reminded-about result, for the page the reminder opens.

    Only its owner can read it: the reminder is what ties the result to them.
    """

    permission_classes = [IsAuthenticated]

    def _get(self, request, record_id):
        return (
            FeedbackReminder.objects.filter(record_id=record_id, user=request.user)
            .select_related("record")
            .first()
        )

    def get(self, request, record_id):
        reminder = self._get(request, record_id)
        if reminder is None:
            return Response(
                {"detail": "This reminder has already been answered or dismissed."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(_reminder_payload(reminder))

    def delete(self, request, record_id):
        reminder = self._get(request, record_id)
        if reminder is not None:
            reminder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
