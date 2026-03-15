from rest_framework import serializers


class DiseaseClassificationRequestSerializer(serializers.Serializer):
    image = serializers.ImageField()
    mode = serializers.ChoiceField(
        choices=("student", "professional"), required=False, default="professional"
    )

    def validate_image(self, value):
        max_size_mb = 5
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(
                f"Image size must be <= {max_size_mb}MB."
            )

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }
        content_type = getattr(value, "content_type", None)
        if content_type not in allowed_types:
            raise serializers.ValidationError(
                "Unsupported image type. Use JPEG, PNG, or WEBP."
            )

        return value


class DiseaseClassificationResponseSerializer(serializers.Serializer):
    disease_name = serializers.CharField()
    short_description = serializers.CharField()
    clinical_diagnosis = serializers.CharField()
    possible_causes = serializers.ListField(
        child=serializers.CharField(), allow_empty=True
    )
    symptoms = serializers.ListField(
        child=serializers.CharField(), allow_empty=True
    )
    recommended_treatment = serializers.CharField()
    confidence = serializers.IntegerField(required=False, min_value=0, max_value=100)
    additional_notes = serializers.CharField(required=False, allow_blank=True)

    # Student-specific extras
    pathophysiology = serializers.CharField(required=False, allow_blank=True)
    visual_cues = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )
    study_topics = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )

    # Professional-specific extras
    treatment_protocol = serializers.DictField(required=False)
    escalation_criteria = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )

    # Shared optional, can be a list of strings or list of {name, reason_excluded}
    differential_diagnoses = serializers.ListField(required=False, allow_empty=True)

    def validate_differential_diagnoses(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list.")
        if not value:
            return value
        if all(isinstance(item, str) for item in value):
            return value
        if all(
            isinstance(item, dict)
            and isinstance(item.get("name"), str)
            and isinstance(item.get("reason_excluded"), str)
            for item in value
        ):
            return value
        raise serializers.ValidationError(
            "Must be a list of strings or objects with name and reason_excluded."
        )

    def validate_treatment_protocol(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Must be an object.")
        medications = value.get("medications", [])
        dosage_notes = value.get("dosage_notes")
        duration = value.get("duration")
        if not isinstance(medications, list) or not all(
            isinstance(item, str) for item in medications
        ):
            raise serializers.ValidationError("medications must be a list of strings.")
        if not isinstance(dosage_notes, str):
            raise serializers.ValidationError("dosage_notes must be a string.")
        if not isinstance(duration, str):
            raise serializers.ValidationError("duration must be a string.")
        return value
