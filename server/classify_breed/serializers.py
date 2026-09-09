from rest_framework import serializers

from core.uploadcare import fetch_uploadcare_file


MIN_DESCRIPTION_LENGTH = 10
MAX_IMAGE_MB = 5
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class BreedClassificationRequestSerializer(serializers.Serializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True)
    text = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate_image(self, value):
        if value in (None, ""):
            return value
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

    def validate(self, attrs):
        image_url = (attrs.pop("image_url", "") or "").strip()
        if image_url and not attrs.get("image"):
            attrs["image"] = fetch_uploadcare_file(
                image_url,
                max_bytes=MAX_IMAGE_MB * 1024 * 1024,
                allowed_types=ALLOWED_IMAGE_TYPES,
                field_name="image_url",
                fallback_name="upload.jpg",
            )

        image = attrs.get("image")
        text = (attrs.get("text") or "").strip()

        if not image and not text:
            raise serializers.ValidationError(
                "Provide a photo or a description of your pet to identify the breed."
            )
        if not image and len(text) < MIN_DESCRIPTION_LENGTH:
            raise serializers.ValidationError(
                "Please describe your pet in a little more detail "
                f"(at least {MIN_DESCRIPTION_LENGTH} characters) when no photo is provided."
            )
        return attrs


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
