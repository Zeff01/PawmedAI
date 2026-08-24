from rest_framework.permissions import BasePermission

from users.models import UserProfile


class IsVeterinaryProfessional(BasePermission):
    """
    Restricts a view to signed-in users whose profile type is Veterinary
    Professional.

    The CBC analyzer interprets raw haematology numbers and names differentials,
    which is only actionable for a clinician — students and fur parents are kept
    out at the API layer rather than only hidden in the UI.
    """

    message = (
        "The CBC Analyzer is available to Veterinary Professional profiles only."
    )

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        profile = getattr(user, "profile", None)
        return bool(
            profile and profile.user_type == UserProfile.UserType.PROFESSIONAL
        )
