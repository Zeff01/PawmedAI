import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from pet_profiles import presenters
from pet_profiles.models import (
    Appointment,
    CareEvent,
    CareEventKind,
    Medication,
    Pet,
    Vaccination,
)
from pet_profiles.serializers import (
    AppointmentSerializer,
    MedicationDoseSerializer,
    MedicationSerializer,
    PetDocumentSerializer,
    PetSerializer,
    VaccinationSerializer,
    WeightEntrySerializer,
)

logger = logging.getLogger(__name__)

TIMELINE_LIMIT = 40


def _owned_pets(user):
    return Pet.objects.filter(owner=user)


def _get_pet(user, pet_id) -> Pet:
    """A pet the requester owns, or a 404 that does not confirm it exists."""
    return get_object_or_404(_owned_pets(user), pk=pet_id)


class DashboardAPIView(APIView):
    """
    Everything the Fur Parent home renders, in one response.

    Shaped to match `client/src/features/fur-parent/types.ts` exactly, so the
    components that were built against preview content need no changes: the
    same keys arrive, composed by `presenters.py`.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        pets = list(
            _owned_pets(request.user).prefetch_related(
                "weight_entries",
                "vaccinations",
                "medications__doses",
                "documents",
                "appointments",
            )
        )

        summaries = []
        wellness = {}
        for pet in pets:
            vaccinations = list(pet.vaccinations.all())
            summaries.append(presenters.pet_summary(pet, vaccinations))
            wellness[str(pet.id)] = presenters.pet_wellness(
                pet,
                weights=list(pet.weight_entries.all()),
                vaccinations=vaccinations,
                medications=list(pet.medications.all()),
                appointment=presenters.next_appointment(pet),
                documents=list(pet.documents.all()),
            )

        timeline = CareEvent.objects.filter(pet__owner=request.user).select_related(
            "pet"
        )[:TIMELINE_LIMIT]

        return Response(
            {
                "pets": summaries,
                "wellness": wellness,
                "timeline": [presenters.care_event(event) for event in timeline],
            }
        )


class PetListCreateAPIView(generics.ListCreateAPIView):
    """The household. Creating a pet is the first thing a new owner does."""

    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _owned_pets(self.request.user)

    def perform_create(self, serializer):
        pet = serializer.save(owner=self.request.user)
        CareEvent.record(
            pet,
            CareEventKind.PET,
            f"{pet.name} joined the family",
            "Profile created. Add a weight, a vaccine, or the next visit to "
            "start the record.",
        )


class PetDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _owned_pets(self.request.user)


class PetChildCreateAPIView(generics.ListCreateAPIView):
    """
    Shared plumbing for the records that hang off one pet.
    """

    permission_classes = [IsAuthenticated]
    relation: str
    event_kind: str

    def get_pet(self) -> Pet:
        if not hasattr(self, "_pet"):
            self._pet = _get_pet(self.request.user, self.kwargs["pet_id"])
        return self._pet

    def get_queryset(self):
        return getattr(self.get_pet(), self.relation).all()

    def describe(self, instance) -> tuple[str, str]:
        """The timeline title and detail for a freshly created row."""
        raise NotImplementedError

    def perform_create(self, serializer):
        pet = self.get_pet()
        with transaction.atomic():
            instance = serializer.save(pet=pet)
            title, detail = self.describe(instance)
            CareEvent.record(pet, self.event_kind, title, detail)


class WeightEntryAPIView(PetChildCreateAPIView):
    serializer_class = WeightEntrySerializer
    relation = "weight_entries"
    event_kind = CareEventKind.WEIGHT

    def describe(self, instance):
        pet = self.get_pet()
        title = f"Weight logged for {pet.name}: {instance.weight_kg} kg"
        detail = instance.note
        if not detail and pet.ideal_weight_kg:
            drift = instance.weight_kg - pet.ideal_weight_kg
            if drift == 0:
                detail = "Exactly on the target weight."
            else:
                direction = "over" if drift > 0 else "under"
                detail = (
                    f"{abs(drift)} kg {direction} the "
                    f"{pet.ideal_weight_kg} kg target."
                )
        return title, detail


class VaccinationAPIView(PetChildCreateAPIView):
    serializer_class = VaccinationSerializer
    relation = "vaccinations"
    event_kind = CareEventKind.VACCINATION

    def describe(self, instance):
        title = f"{instance.name} recorded for {self.get_pet().name}"
        if instance.due_on:
            return title, f"Next one due {instance.due_on:%d %b %Y}."
        return title, instance.notes


class MedicationListCreateAPIView(PetChildCreateAPIView):
    serializer_class = MedicationSerializer
    relation = "medications"
    event_kind = CareEventKind.DOSE

    def describe(self, instance):
        return (
            f"{instance.name} added to {self.get_pet().name}'s routine",
            f"{instance.get_cadence_display()} · {instance.get_form_display()}",
        )


class AppointmentAPIView(PetChildCreateAPIView):
    serializer_class = AppointmentSerializer
    relation = "appointments"
    event_kind = CareEventKind.APPOINTMENT

    def describe(self, instance):
        return (
            f"{instance.title} booked for {self.get_pet().name}",
            f"{instance.starts_at:%d %b %Y, %H:%M}"
            + (f" · {instance.clinic}" if instance.clinic else ""),
        )


class PetDocumentAPIView(PetChildCreateAPIView):
    serializer_class = PetDocumentSerializer
    relation = "documents"
    event_kind = CareEventKind.DOCUMENT
    parser_classes = [MultiPartParser, FormParser]

    def describe(self, instance):
        return (
            f"{instance.label} uploaded for {self.get_pet().name}",
            instance.note or instance.get_kind_display(),
        )


class MedicationDoseAPIView(APIView):
    """
    Logs a dose and moves the schedule on.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, medication_id):
        medication = get_object_or_404(
            Medication.objects.select_related("pet"),
            pk=medication_id,
            pet__owner=request.user,
        )

        serializer = MedicationDoseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            dose = serializer.save(medication=medication)
            given_on = presenters.local_date(dose.given_at)
            medication.advance_schedule(given_on)
            CareEvent.record(
                medication.pet,
                CareEventKind.DOSE,
                f"{medication.name} given to {medication.pet.name}",
                dose.note
                or (
                    f"Next dose {medication.next_due_on:%d %b}."
                    if medication.next_due_on
                    else f"{medication.get_cadence_display()} regimen."
                ),
            )

        return Response(
            MedicationDoseSerializer(dose).data, status=status.HTTP_201_CREATED
        )


class VaccinationDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VaccinationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Vaccination.objects.filter(pet__owner=self.request.user)


class MedicationDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Medication.objects.filter(pet__owner=self.request.user)


class AppointmentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    One booked visit — what the dashboard's "Reschedule" moves.
    """

    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Appointment.objects.filter(pet__owner=self.request.user)

    def perform_update(self, serializer):
        was = serializer.instance.starts_at
        with transaction.atomic():
            appointment = serializer.save()
            if appointment.starts_at != was:
                CareEvent.record(
                    appointment.pet,
                    CareEventKind.APPOINTMENT,
                    f"{appointment.title} moved for {appointment.pet.name}",
                    f"Now {appointment.starts_at:%d %b %Y, %H:%M}"
                    + (
                        f" · {appointment.clinic}"
                        if appointment.clinic
                        else ""
                    ),
                )
