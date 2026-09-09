"""
Write serializers for the pet-owner API.

Reads do not go through serializers at all — `presenters.py` composes the
dashboard payload, because what the client needs back is a view-model with
derived prose in it, not a field-for-field mirror of these tables. These
classes exist for the other direction: validating what an owner sends in.
"""

from django.utils import timezone
from rest_framework import serializers

from core.uploadcare import fetch_uploadcare_file

from pet_profiles.models import (
    Appointment,
    Medication,
    MedicationDose,
    Pet,
    PetDocument,
    Vaccination,
    WeightEntry,
)

#: 25 MB. Large enough for a scanned multi-page lab panel, small enough that a
MAX_DOCUMENT_BYTES = 25 * 1024 * 1024


class PetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pet
        fields = [
            "id",
            "name",
            "species",
            "breed",
            "photo_url",
            "birth_date",
            "sex",
            "neuter_status",
            "ideal_weight_kg",
            "microchip_number",
            "insurance_provider",
            "insurance_policy",
            "indoor_only",
            "is_favourite",
            "clinic_name",
            "notes",
        ]

    def validate_birth_date(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError("A birth date cannot be in the future.")
        return value

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Your pet needs a name.")
        return name


class WeightEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightEntry
        fields = ["id", "weight_kg", "recorded_on", "note"]

    def validate_weight_kg(self, value):
        if value <= 0:
            raise serializers.ValidationError("A weight has to be above zero.")
        if value > 200:
            raise serializers.ValidationError(
                "That looks too heavy for a household pet — check the units."
            )
        return value

    def validate_recorded_on(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("You cannot log a future weigh-in.")
        return value


class VaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccination
        fields = ["id", "name", "administered_on", "due_on", "clinic", "notes"]

    def validate(self, attrs):
        if not attrs.get("administered_on") and not attrs.get("due_on"):
            raise serializers.ValidationError(
                "Record when it was given, when it is due, or both."
            )
        return attrs


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = [
            "id",
            "name",
            "detail",
            "form",
            "cadence",
            "next_due_on",
            "is_active",
        ]


class MedicationDoseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationDose
        fields = ["id", "given_at", "note"]

    def validate_given_at(self, value):
        if value > timezone.now():
            raise serializers.ValidationError(
                "A dose cannot be logged before it is given."
            )
        return value


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "id",
            "title",
            "clinic",
            "vet_name",
            "vet_role",
            "starts_at",
            "address",
            "status",
            "notes",
        ]


class PetDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.URLField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = PetDocument
        fields = ["id", "label", "kind", "file", "note", "file_url"]
        extra_kwargs = {"file": {"required": False}}

    def validate_file(self, value):
        if value.size > MAX_DOCUMENT_BYTES:
            limit = MAX_DOCUMENT_BYTES // (1024 * 1024)
            raise serializers.ValidationError(
                f"That file is larger than {limit} MB."
            )
        return value

    def validate(self, attrs):
        file_url = (attrs.pop("file_url", "") or "").strip()
        if file_url and not attrs.get("file"):
            attrs["file"] = fetch_uploadcare_file(
                file_url,
                max_bytes=MAX_DOCUMENT_BYTES,
                field_name="file_url",
                fallback_name="document",
            )

        if not attrs.get("file"):
            raise serializers.ValidationError(
                {"file": "Attach a document to upload."}
            )
        return attrs

    def validate_label(self, value):
        label = value.strip()
        if not label:
            raise serializers.ValidationError("Give the document a label.")
        return label
