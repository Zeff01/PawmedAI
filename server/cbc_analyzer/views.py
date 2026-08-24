import logging
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from cbc_analyzer.models import MedicalLog, Pet
from cbc_analyzer.pagination import MedicalLogPagination
from cbc_analyzer.permissions import IsVeterinaryProfessional
from cbc_analyzer.reference import (
    OVERALL_NORMAL,
    SPECIES_CANINE,
    SPECIES_CHOICES,
    SPECIES_FELINE,
    describe_flags,
    evaluate_panel,
)
from cbc_analyzer.serializers import (
    CBCAnalyzeRequestSerializer,
    MedicalLogDetailSerializer,
    MedicalLogListSerializer,
    MedicalLogWriteSerializer,
    PetSerializer,
)
from cbc_analyzer.services.cbc_analyzer import CBCAnalyzer
from cbc_analyzer.throttles import CBCAnalyzeThrottle

logger = logging.getLogger(__name__)

_SPECIES_LABELS = dict(SPECIES_CHOICES)


def _species_display(species: str, species_label: str) -> str:
    """The label shown next to the patient's name in the results panel."""
    if species == "other":
        return species_label.strip() or "Other"
    return _SPECIES_LABELS.get(species, species)


def _build_patient(
    data: dict, extracted: dict, species: str
) -> tuple[dict, list[str]]:
    """
    Merge the typed patient context with anything read off the report.

    What the clinician typed always wins; the report only fills the gaps. Species
    is never taken from the image — it selects the reference table, so it stays a
    deliberate choice rather than an OCR guess.

    Returns the merged patient plus the names of the fields the report supplied,
    so the UI can show which details were prefilled rather than typed.
    """
    from_report: list[str] = []

    def pick(field: str) -> str:
        typed = (data.get(field) or "").strip()
        if typed:
            return typed
        read = (extracted.get(field) or "").strip()
        if read:
            from_report.append(field)
        return read

    def pick_choice(field: str) -> str:
        typed = data.get(field) or "unknown"
        if typed != "unknown":
            return typed
        read = extracted.get(field) or "unknown"
        if read != "unknown":
            from_report.append(field)
        return read

    species_label = pick("species_label")
    pet_name = pick("pet_name")
    owner_name = pick("owner_name")
    breed = pick("breed")
    sex = pick_choice("sex")
    neuter_status = pick_choice("neuter_status")

    age = data.get("age_years")
    if age is None:
        age = extracted.get("age_years")
        if age is not None:
            from_report.append("age_years")

    return (
        {
            "pet_name": pet_name,
            "owner_name": owner_name,
            "species": species,
            "species_label": species_label,
            "species_display": _species_display(species, species_label),
            "breed": breed,
            "age_years": float(age) if age is not None else None,
            "sex": sex,
            "neuter_status": neuter_status,
        },
        from_report,
    )


def _species_mismatch_notice(
    selected: str, selected_display: str, extracted: dict
) -> str:
    """
    Warn when the report names a different species than the one selected.

    Species picks the reference table, so a mismatch means the whole Low/High
    column could be wrong. It is surfaced rather than auto-corrected: silently
    overriding a clinician's deliberate choice from an OCR guess would be worse.

    Only `canine` and `feline` count as the report making a claim. An extracted
    `other` means "not recognisably a dog or a cat", which is the absence of a
    claim, not a contradiction — warning on it produced a notice that fired on
    almost every upload and told the clinician nothing.
    """
    read = (extracted.get("species") or "").strip()
    if read not in {SPECIES_CANINE, SPECIES_FELINE} or read == selected:
        return ""
    return (
        f"The report appears to be a {read} panel, but these values were "
        f"flagged against {selected_display} reference intervals. "
        "Double-check the species if the flags look wrong."
    )


def _resolve_species(requested: str, extracted: dict) -> tuple[str | None, str]:
    """
    Decide which reference table to flag against, asking as a last resort.

    1. What the clinician chose, when they chose something. Always wins.
    2. What the report printed. Veterinary lab printouts normally state the
       species, so this covers most uploads without anyone being asked.

    There used to be a third tier that inferred the species from MCV and MCH,
    which worked while the table held only dogs and cats — those two ranges do
    not overlap. With a dozen species it is no longer sound: an MCV of 45 fL fits
    feline, equine, and bovine alike, so the inference would be a coin toss
    dressed up as a finding. It was removed rather than left to mislead.

    Returns `(species, source)`. A `None` species means neither source could
    decide and the caller has to ask.
    """
    if requested:
        return requested, "selected"

    read = (extracted.get("species") or "").strip()
    if read in dict(SPECIES_CHOICES):
        return read, "report"

    return None, "unknown"


class CBCAnalyzeAPIView(APIView):
    """
    Analyse a CBC panel and return flagged results plus a diagnostic brief.

    Accepts a typed-in panel (JSON), a photographed report (multipart), or both.
    When an image is supplied its transcribed values fill the gaps in what the
    clinician typed — a value entered by hand always wins over the same value
    read off the image, because the person in the room can see the printout.
    """

    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsVeterinaryProfessional]
    throttle_classes = [CBCAnalyzeThrottle]

    def post(self, request):
        serializer = CBCAnalyzeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        uploaded_image = data.get("image")
        typed_values = dict(data.get("values") or {})
        sample_quality = list(data.get("sample_quality") or [])
        smear_morphology = (data.get("smear_morphology") or "").strip()

        extracted_values: dict = {}
        extracted_patient: dict = {}
        extraction_notice = ""
        read_from_image = False
        looks_human = False

        try:
            analyzer = CBCAnalyzer()

            # ── Step 1 — transcribe the report image, when there is one ──────
            if uploaded_image:
                extraction = analyzer.extract_panel(uploaded_image)

                if not extraction["is_cbc_report"]:
                    reason = extraction["unreadable_reason"] or (
                        "The image does not look like a complete blood count report."
                    )
                    if not typed_values:
                        return Response(
                            {
                                "detail": reason,
                                "code": "not_a_cbc_report",
                            },
                            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        )
                    extraction_notice = (
                        f"{reason} Only the values you entered by hand were used."
                    )
                else:
                    extracted_values = extraction["values"]
                    read_from_image = bool(extracted_values)
                    # Tolerate a missing key: the flag is advisory, and losing it
                    # should degrade to "not flagged", never to a 500.
                    looks_human = bool(extraction.get("is_human_report", False))
                    if extraction["unreadable_reason"]:
                        extraction_notice = extraction["unreadable_reason"]
                    elif not extracted_values:
                        extraction_notice = (
                            "No blood values could be read from that image. "
                            "Enter the panel by hand to continue."
                        )

                    # Only adopt image-read context the clinician left blank —
                    # the person holding the printout always wins.
                    extracted_patient = extraction["patient"]
                    if not sample_quality:
                        sample_quality = extraction["sample_quality"]
                    if not smear_morphology:
                        smear_morphology = extraction["smear_morphology"]

            values = {**extracted_values, **typed_values}
            if not values:
                return Response(
                    {
                        "detail": (
                            extraction_notice
                            or "No blood values were found. Enter the panel by hand "
                            "or upload a clearer report."
                        ),
                        "code": "no_values",
                    },
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            # ── Step 2 — work out which reference table applies ──────────────
            requested_species = (data.get("species") or "").strip()
            species, species_source = _resolve_species(
                requested_species, extracted_patient
            )

            if species is None:
                # A human panel is the most likely reason inference abstained:
                # human indices sit outside both the canine and feline ranges.
                # Say so, because "dog or cat?" is the wrong question to ask
                # about a human report — but still let it be overridden, since a
                # false positive must not block real veterinary work.
                detail = (
                    (
                        "This looks like a human CBC report — the patient details "
                        "and printed reference ranges are human. The analyzer only "
                        "flags against canine and feline intervals. If it really is "
                        "a dog or a cat, choose the species to continue."
                    )
                    if looks_human
                    else (
                        "This panel does not say which species it is for. Choose "
                        "the species so the values can be flagged against the "
                        "right reference intervals."
                    )
                )
                return Response(
                    {
                        "detail": detail,
                        "code": "species_required",
                        "looks_human": looks_human,
                    },
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            # ── Step 3 — flag every value against that table ─────────────────
            evaluation = evaluate_panel(values, species)

            patient, patient_from_report = _build_patient(
                data, extracted_patient, species
            )

            # Only meaningful when the clinician made an explicit choice — a
            # species that came from the report cannot disagree with itself.
            if species_source == "selected":
                mismatch = _species_mismatch_notice(
                    species, patient["species_display"], extracted_patient
                )
                if mismatch:
                    extraction_notice = " ".join(
                        part for part in (extraction_notice, mismatch) if part
                    ).strip()

            # The clinician chose to proceed on a report that reads as human, so
            # the flags stand but the brief should not be trusted blindly.
            if looks_human:
                extraction_notice = " ".join(
                    part
                    for part in (
                        extraction_notice,
                        "This report reads as a human CBC. It was flagged against "
                        f"{patient['species_display']} intervals, "
                        "so treat the results with care.",
                    )
                    if part
                ).strip()

            # ── Step 3 — narrate the flagged panel ───────────────────────────
            try:
                narrative = analyzer.interpret(
                    patient=patient,
                    evaluation=evaluation,
                    sample_quality=sample_quality,
                    smear_morphology=smear_morphology,
                )
            except Exception:
                # A failed narrative must not lose the clinician's numbers — the
                # flagged panel is the clinically useful half of the response.
                logger.exception("CBC interpretation failed; returning flags only.")
                narrative = {
                    "key_findings": describe_flags(evaluation["flags"])[:255],
                    "diagnostic_brief": "",
                    "clinical_notes": "",
                }
                extraction_notice = " ".join(
                    part
                    for part in (
                        extraction_notice,
                        "The written interpretation could not be generated. "
                        "The flagged values below are still accurate.",
                    )
                    if part
                ).strip()

        except ValueError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except Exception as exc:
            logger.exception("CBC analysis failed.")
            return Response(
                {
                    "detail": "Failed to analyse the CBC panel.",
                    "error": str(exc) or repr(exc),
                    "error_type": exc.__class__.__name__,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "patient": patient,
                "values": values,
                "results": evaluation["results"],
                "flags": evaluation["flags"],
                "result_status": evaluation["result_status"],
                "flag_count": len(evaluation["flags"]),
                "missing_required": evaluation["missing_required"],
                "sample_quality": sample_quality,
                "smear_morphology": smear_morphology,
                "read_from_image": read_from_image,
                "extracted_values": sorted(extracted_values.keys()),
                "extracted_patient_fields": sorted(set(patient_from_report)),
                # How the reference table was chosen, so the UI can show it and
                # offer a correction instead of presenting it as settled fact.
                "species_source": species_source,
                # Analytes with no interval for this species, and why.
                "not_assessed": evaluation["not_assessed"],
                "species_caveat": evaluation["caveat"],
                "notice": extraction_notice,
                **narrative,
            },
            status=status.HTTP_200_OK,
        )


class PetListCreateAPIView(generics.ListCreateAPIView):
    """The requesting clinician's own patient roster."""

    serializer_class = PetSerializer
    permission_classes = [IsVeterinaryProfessional]

    def get_queryset(self):
        queryset = (
            Pet.objects.filter(user=self.request.user)
            .annotate(log_count_annotated=Count("medical_logs"))
            .order_by("name", "id")
        )
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(owner_name__icontains=search)
                | Q(breed__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PetDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PetSerializer
    permission_classes = [IsVeterinaryProfessional]

    def get_queryset(self):
        return Pet.objects.filter(user=self.request.user)


def _window_days(params) -> int | None:
    """The `days` filter as a positive int, or None for "all time"."""
    raw = (params.get("days") or "").strip()
    if raw.isdigit() and int(raw) > 0:
        return int(raw)
    return None


def _apply_log_filters(queryset, params, *, include_days: bool = True):
    """
    The medical log's filters, shared by the list and the summary.

    Kept in one place so the dashboard tiles always describe exactly the rows the
    table is showing — two copies of this would drift and quietly disagree.
    """
    search = (params.get("search") or "").strip()
    if search:
        queryset = queryset.filter(
            Q(pet_name__icontains=search)
            | Q(owner_name__icontains=search)
            | Q(breed__icontains=search)
            | Q(record_id__icontains=search)
        )

    species = (params.get("species") or "").strip()
    if species:
        queryset = queryset.filter(species=species)

    result_status = (params.get("result_status") or "").strip()
    if result_status:
        queryset = queryset.filter(result_status=result_status)

    pet_id = (params.get("pet") or "").strip()
    if pet_id.isdigit():
        queryset = queryset.filter(pet_id=int(pet_id))

    window = _window_days(params)
    if include_days and window:
        since = timezone.localdate() - timedelta(days=window)
        queryset = queryset.filter(test_date__gte=since)

    return queryset


def _percent_change(current: int, previous: int) -> int | None:
    """Whole-percent change, or None when there is no baseline to divide by."""
    if not previous:
        return None
    return round(((current - previous) / previous) * 100)


class MedicalLogListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsVeterinaryProfessional]
    pagination_class = MedicalLogPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MedicalLogWriteSerializer
        return MedicalLogListSerializer

    def get_queryset(self):
        queryset = _apply_log_filters(
            MedicalLog.objects.filter(user=self.request.user),
            self.request.query_params,
        )
        return queryset.select_related("pet")

    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        log = write_serializer.save()
        return Response(
            MedicalLogDetailSerializer(log).data, status=status.HTTP_201_CREATED
        )


class MedicalLogDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Read, amend, or delete one saved record.

    Amending is limited to the fields a clinician revisits after the fact — the
    smear description and their own notes.  Correcting a blood value means
    re-running the analysis, so the numbers are not editable here.
    """

    serializer_class = MedicalLogDetailSerializer
    permission_classes = [IsVeterinaryProfessional]
    lookup_field = "record_id"

    EDITABLE_FIELDS = ("smear_morphology", "clinical_notes", "vet_name")

    def get_queryset(self):
        return MedicalLog.objects.filter(user=self.request.user).select_related("pet")

    def update(self, request, *args, **kwargs):
        log = self.get_object()
        updates = {
            field: request.data[field]
            for field in self.EDITABLE_FIELDS
            if field in request.data
        }
        if not updates:
            return Response(
                {
                    "detail": (
                        "Only the blood smear description, clinical notes, and "
                        "attending vet can be amended."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        for field, value in updates.items():
            setattr(log, field, str(value or ""))
        log.save(update_fields=[*updates.keys(), "updated_at"])
        return Response(MedicalLogDetailSerializer(log).data)


class MedicalLogSummaryAPIView(APIView):
    """
    Counts for the medical log dashboard tiles.

    Scoped to the same filters as the list, so a tile never contradicts the table
    under it. When a date window is active the normal and abnormal tiles also
    carry a change against the immediately preceding window of equal length —
    that comparison is only meaningful because the counts are period-scoped;
    an all-time count beside a month-over-month delta would read as one figure
    and be two.
    """

    permission_classes = [IsVeterinaryProfessional]

    def get(self, request):
        params = request.query_params
        owned = MedicalLog.objects.filter(user=request.user)
        scoped = _apply_log_filters(owned, params)

        totals = scoped.aggregate(
            total=Count("id"),
            normal=Count("id", filter=Q(result_status=OVERALL_NORMAL)),
        )
        abnormal = totals["total"] - totals["normal"]

        normal_change = None
        abnormal_change = None
        window = _window_days(params)
        if window:
            today = timezone.localdate()
            current_start = today - timedelta(days=window)
            previous = (
                _apply_log_filters(owned, params, include_days=False)
                .filter(
                    test_date__gte=current_start - timedelta(days=window),
                    test_date__lt=current_start,
                )
                .aggregate(
                    total=Count("id"),
                    normal=Count("id", filter=Q(result_status=OVERALL_NORMAL)),
                )
            )
            normal_change = _percent_change(totals["normal"], previous["normal"])
            abnormal_change = _percent_change(
                abnormal, previous["total"] - previous["normal"]
            )

        # "This month" is a calendar figure, so it ignores the date window but
        # still respects the other filters.
        month_start = timezone.localdate().replace(day=1)
        this_month = (
            _apply_log_filters(owned, params, include_days=False)
            .filter(test_date__gte=month_start)
            .count()
        )

        return Response(
            {
                "total": totals["total"],
                "normal": totals["normal"],
                "abnormal": abnormal,
                "normal_change": normal_change,
                "abnormal_change": abnormal_change,
                "this_month": this_month,
                "window_days": window,
            }
        )
