from rest_framework import serializers


class BreedClassificationRequestSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True)

    def validate_image(self, value):
        max_size_mb = 5
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(
                f"Image size must be <= {max_size_mb}MB."
            )
        allowed_types = {"image/jpeg", "image/png", "image/webp"}
        content_type = getattr(value, "content_type", None)
        if content_type not in allowed_types:
            raise serializers.ValidationError(
                "Unsupported image type. Use JPEG, PNG, or WEBP."
            )
        return value


class BreedClassificationResponseSerializer(serializers.Serializer):
    animal_type = serializers.CharField(required=False, allow_blank=True)
    breed_name = serializers.CharField()
    confidence = serializers.IntegerField(min_value=0, max_value=100)
    description = serializers.CharField()
    origin = serializers.CharField(required=False, allow_blank=True)
    size = serializers.ChoiceField(
        choices=("small", "medium", "large", "extra-large"),
        required=False,
        allow_blank=True,
    )
    temperament = serializers.ListField(
        child=serializers.CharField(), allow_empty=True
    )
    common_traits = serializers.ListField(
        child=serializers.CharField(), allow_empty=True
    )
    care_tips = serializers.ListField(
        child=serializers.CharField(), allow_empty=True
    )
    fun_fact = serializers.CharField(required=False, allow_blank=True)
    not_identified = serializers.BooleanField(default=False)
