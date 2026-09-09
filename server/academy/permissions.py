from rest_framework.permissions import BasePermission

from users.models import UserProfile


class IsVeterinaryStudent(BasePermission):
    """Restricts a view to signed-in Veterinary Student profiles.

    The academy is coursework: the cases carry model answers and the points are
    a student's own record, so the gate is at the API rather than only in the
    navigation a professional or fur parent never sees.
    """

    message = "The case academy is available to Veterinary Student profiles only."

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        profile = getattr(user, "profile", None)
        return bool(
            profile and profile.user_type == UserProfile.UserType.STUDENT
        )
