import json

from rest_framework import serializers

from cbc_analyzer.models import MedicalLog, NeuterStatus, Pet, Sex
from cbc_analyzer.reference import (
    ANALYTE_KEYS,
    SPECIES_CHOICES,
    evaluate_panel,
)

SAMPLE_QUALITY_FLAGS = ("hemolyzed", "lipemic", "clotted")

MAX_IMAGE_MB = 8
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class JSONCompatibleField(serializers.Field):
    """
    A field that accepts real JSON *or* a JSON-encoded string.

    The analyze endpoint is reached two ways: as `application/json` when the
    clinician types the panel in by hand, and as `multipart/form-data` when a
    report image comes along with it.  Multipart flattens everything to strings,
    so `values` arrives as `'{"rbc": 7.23}'` rather than an object.
    """

    def __init__(self, expect=dict, **kwargs):
        self.expect = expect
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if isinstance(data, str):
            stripped = data.strip()
            if not stripped:
                return self.expect()
            try:
                data = json.loads(stripped)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Expected valid JSON.")
        if not isinstance(data, self.expect):
            expected = "an object" if self.expect is dict else "a list"
            raise serializers.ValidationError(f"Expected {expected}.")
        return data

    def to_representation(self, value):
        return value


class PetSerializer(serializers.ModelSerializer):
    species_display = serializers.CharField(read_only=True)
    log_count = serializers.SerializerMethodField()

    class Meta:
        model = Pet
        fields = (
            "id",
            "name",
            "species",
            "species_label",
            "species_display",
            "breed",
            "age_years",
            "sex",
            "neuter_status",
            "owner_name",
            "notes",
            "log_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_log_count(self, obj) -> int:
        # Annotated by the list view; fall back to a query for single-object use.
        annotated = getattr(obj, "log_count_annotated", None)
        if annotated is not None:
            return annotated
        return obj.medical_logs.count()

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Give the patient a name.")
        return cleaned

    def validate(self, attrs):
        species = attrs.get("species", getattr(self.instance, "species", None))
        label = (
            attrs.get("species_label", getattr(self.instance, "species_label", ""))
            or ""
        ).strip()
        if species == "other" and not label:
            raise serializers.ValidationError(
                {"species_label": "Name the species when choosing Other."}
            )
        return attrs


class PatientContextSerializer(serializers.Serializer):
    """The patient context every interpretation needs, shared by both flows."""

    pet_name = serializers.CharField(
        required=False, allow_blank=True, max_length=120
    )
    owner_name = serializers.CharField(
        required=False, allow_blank=True, max_length=120
    )
    species = serializers.ChoiceField(choices=SPECIES_CHOICES)
    species_label = serializers.CharField(
        required=False, allow_blank=True, max_length=60
    )
    breed = serializers.CharField(required=False, allow_blank=True, max_length=120)
    age_years = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=0,
        max_value=100,
    )
    sex = serializers.ChoiceField(
        choices=Sex.choices, required=False, default=Sex.UNKNOWN
    )
    neuter_status = serializers.ChoiceField(
        choices=NeuterStatus.choices, required=False, default=NeuterStatus.UNKNOWN
    )


class CBCAnalyzeRequestSerializer(PatientContextSerializer):
    species = serializers.ChoiceField(
        choices=SPECIES_CHOICES, required=False, allow_blank=True
    )
    image = serializers.ImageField(required=False, allow_null=True)
    values = JSONCompatibleField(expect=dict, required=False)
    sample_quality = JSONCompatibleField(expect=list, required=False)
    smear_morphology = serializers.CharField(
        required=False, allow_blank=True, max_length=2000
    )

    def validate_image(self, value):
        if value in (None, ""):
            return value
        if value.size > MAX_IMAGE_MB * 1024 * 1024:
            raise serializers.ValidationError(
                f"The report image must be {MAX_IMAGE_MB}MB or smaller."
            )
        if getattr(value, "content_type", None) not in ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError(
                "Unsupported image type. Use JPEG, PNG, or WEBP."
            )
        return value

    def validate_values(self, value):
        return validate_analyte_values(value)

    def validate_sample_quality(self, value):
        return validate_sample_quality(value)

    def validate(self, attrs):
        if not attrs.get("image") and not attrs.get("values"):
            raise serializers.ValidationError(
                "Upload a CBC report or enter at least one blood value."
            )
        # Only enforced when a species was actually supplied; an absent species
        # is resolved by the view rather than rejected here.
        if attrs.get("species") == "other" and not (
            attrs.get("species_label") or ""
        ).strip():
            raise serializers.ValidationError(
                {"species_label": "Name the species when choosing Other."}
            )
        return attrs


class MedicalLogListSerializer(serializers.ModelSerializer):
    species_display = serializers.CharField(read_only=True)
    pet_id = serializers.IntegerField(source="pet.id", read_only=True, default=None)

    class Meta:
        model = MedicalLog
        fields = (
            "id",
            "record_id",
            "pet_id",
            "pet_name",
            "species",
            "species_display",
            "breed",
            "test_type",
            "test_date",
            "key_findings",
            "result_status",
            "flag_count",
            "created_at",
        )


class MedicalLogDetailSerializer(serializers.ModelSerializer):
    species_display = serializers.CharField(read_only=True)
    pet_id = serializers.IntegerField(source="pet.id", read_only=True, default=None)

    class Meta:
        model = MedicalLog
        fields = (
            "id",
            "record_id",
            "pet_id",
            "pet_name",
            "owner_name",
            "species",
            "species_label",
            "species_display",
            "breed",
            "age_years",
            "sex",
            "neuter_status",
            "test_type",
            "test_date",
            "values",
            "evaluation",
            "result_status",
            "flag_count",
            "key_findings",
            "diagnostic_brief",
            "clinical_notes",
            "sample_quality",
            "smear_morphology",
            "vet_name",
            "created_at",
            "updated_at",
        )


class MedicalLogWriteSerializer(PatientContextSerializer, serializers.ModelSerializer):
    """
    Creates or updates a saved CBC record.

    The flags are never taken from the request: `values` is re-evaluated against
    the server-side reference table on every write, so a stored record can always
    be trusted to match the table that produced it.  Only the AI narrative is
    carried over from the analyze response, to avoid paying for a second model
    call on save.
    """

    pet = serializers.PrimaryKeyRelatedField(
        queryset=Pet.objects.none(), required=False, allow_null=True
    )
    values = JSONCompatibleField(expect=dict)
    sample_quality = JSONCompatibleField(expect=list, required=False)

    class Meta:
        model = MedicalLog
        fields = (
            "pet",
            "pet_name",
            "owner_name",
            "species",
            "species_label",
            "breed",
            "age_years",
            "sex",
            "neuter_status",
            "test_date",
            "values",
            "sample_quality",
            "smear_morphology",
            "clinical_notes",
            "key_findings",
            "diagnostic_brief",
            "vet_name",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None:
            # Scope the pet choices to the requesting clinician so a record can
            # never be attached to somebody else's patient.
            self.fields["pet"].queryset = Pet.objects.filter(user=request.user)

    def validate_values(self, value):
        cleaned = validate_analyte_values(value)
        if not cleaned:
            raise serializers.ValidationError(
                "A record needs at least one blood value."
            )
        return cleaned

    def validate_sample_quality(self, value):
        return validate_sample_quality(value)

    def validate(self, attrs):
        pet = attrs.get("pet")
        if pet is not None:
            attrs["pet_name"] = pet.name
            attrs["species"] = pet.species
            attrs["species_label"] = pet.species_label
            attrs["breed"] = pet.breed or attrs.get("breed", "")
            attrs["age_years"] = (
                pet.age_years if pet.age_years is not None else attrs.get("age_years")
            )
            attrs["sex"] = pet.sex
            attrs["neuter_status"] = pet.neuter_status
            attrs["owner_name"] = pet.owner_name or attrs.get("owner_name", "")

        if attrs.get("species") == "other" and not (
            attrs.get("species_label") or ""
        ).strip():
            raise serializers.ValidationError(
                {"species_label": "Name the species when choosing Other."}
            )

        evaluation = evaluate_panel(attrs["values"], attrs.get("species"))
        attrs["evaluation"] = evaluation
        attrs["result_status"] = evaluation["result_status"]
        attrs["flag_count"] = len(evaluation["flags"])
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        validated_data["test_type"] = MedicalLog.TEST_TYPE_CBC
        return super().create(validated_data)


# ── Shared validators ────────────────────────────────────────────────────────


def validate_analyte_values(value) -> dict:
    """Keep known analytes with usable numbers; reject anything malformed."""
    if not isinstance(value, dict):
        raise serializers.ValidationError("Expected an object of blood values.")

    unknown = [key for key in value if key not in ANALYTE_KEYS]
    if unknown:
        raise serializers.ValidationError(
            f"Unknown blood value keys: {', '.join(sorted(unknown))}."
        )

    cleaned: dict[str, float] = {}
    errors: dict[str, str] = {}
    for key, raw in value.items():
        if raw is None or raw == "":
            continue
        try:
            number = float(raw)
        except (TypeError, ValueError):
            errors[key] = "Enter a number."
            continue
        if number != number or number in (float("inf"), float("-inf")):
            errors[key] = "Enter a number."
            continue
        if number < 0:
            errors[key] = "A blood value cannot be negative."
            continue
        cleaned[key] = number

    if errors:
        raise serializers.ValidationError(errors)
    return cleaned


def validate_sample_quality(value) -> list:
    if not isinstance(value, list):
        raise serializers.ValidationError("Expected a list of quality flags.")
    flags = [str(item).strip().lower() for item in value]
    invalid = [flag for flag in flags if flag not in SAMPLE_QUALITY_FLAGS]
    if invalid:
        raise serializers.ValidationError(
            f"Unsupported sample quality flags: {', '.join(sorted(set(invalid)))}."
        )
    # Order the flags so two identical submissions store identically.
    return [flag for flag in SAMPLE_QUALITY_FLAGS if flag in set(flags)]
