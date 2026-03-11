from rest_framework import serializers


class DiseaseClassificationRequestSerializer(serializers.Serializer):
    image = serializers.ImageField()

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
