from datetime import date, timedelta

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Species(models.TextChoices):
    DOG = "dog", "Dog"
    CAT = "cat", "Cat"
    OTHER = "other", "Other"


class Sex(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"
    UNKNOWN = "unknown", "Unknown"


class NeuterStatus(models.TextChoices):
    INTACT = "intact", "Intact"
    NEUTERED = "neutered", "Neutered"
    SPAYED = "spayed", "Spayed"
    UNKNOWN = "unknown", "Unknown"


class Pet(models.Model):
    """One animal in the signed-in owner's household."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="fur_parent_pets",
    )
    name = models.CharField(max_length=120)
    species = models.CharField(
        max_length=16, choices=Species.choices, default=Species.DOG
    )
    breed = models.CharField(max_length=120, blank=True)
    photo_url = models.URLField(max_length=500, blank=True)
    birth_date = models.DateField(
        null=True,
        blank=True,
        help_text="Used to derive the age shown on the card.",
    )
    sex = models.CharField(max_length=16, choices=Sex.choices, default=Sex.UNKNOWN)
    neuter_status = models.CharField(
        max_length=16, choices=NeuterStatus.choices, default=NeuterStatus.UNKNOWN
    )
    ideal_weight_kg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    microchip_number = models.CharField(max_length=64, blank=True)
    insurance_provider = models.CharField(max_length=120, blank=True)
    insurance_policy = models.CharField(max_length=120, blank=True)
    indoor_only = models.BooleanField(default=False)
    is_favourite = models.BooleanField(default=False)
    clinic_name = models.CharField(max_length=160, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_favourite", "name", "id"]
        indexes = [models.Index(fields=["owner", "name"])]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_species_display()})"

    @property
    def age_months(self) -> int | None:
        """Whole months since `birth_date`, or None when it is unknown."""
        if not self.birth_date:
            return None
        today = timezone.localdate()
        months = (today.year - self.birth_date.year) * 12 + (
            today.month - self.birth_date.month
        )
        if today.day < self.birth_date.day:
            months -= 1
        return max(months, 0)

    @property
    def latest_weight(self) -> "WeightEntry | None":
        return self.weight_entries.first()


class WeightEntry(models.Model):
    """A weigh-in. The newest one is what the vitals card reports."""

    pet = models.ForeignKey(
        Pet, on_delete=models.CASCADE, related_name="weight_entries"
    )
    weight_kg = models.DecimalField(
        max_digits=6, decimal_places=2, validators=[MinValueValidator(0)]
    )
    recorded_on = models.DateField(default=timezone.localdate)
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_on", "-id"]
        indexes = [models.Index(fields=["pet", "-recorded_on"])]

    def __str__(self) -> str:
        return f"{self.pet_id}: {self.weight_kg} kg on {self.recorded_on}"


class Vaccination(models.Model):
    pet = models.ForeignKey(
        Pet, on_delete=models.CASCADE, related_name="vaccinations"
    )
    name = models.CharField(max_length=160)
    administered_on = models.DateField(null=True, blank=True)
    due_on = models.DateField(
        null=True,
        blank=True,
        help_text="When the next dose is due, or when this one expires.",
    )
    clinic = models.CharField(max_length=160, blank=True)
    notes = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_on", "name", "id"]
        indexes = [models.Index(fields=["pet", "due_on"])]

    def __str__(self) -> str:
        return f"{self.name} for {self.pet_id}"

    @property
    def is_upcoming(self) -> bool:
        """True once the due date is the nearest thing about this record."""
        return bool(self.due_on and self.due_on >= timezone.localdate())

    @property
    def is_overdue(self) -> bool:
        return bool(self.due_on and self.due_on < timezone.localdate())


class MedicationForm(models.TextChoices):
    PILL = "pill", "Pill or tablet"
    CHEW = "chew", "Soft chew"
    TOPICAL = "topical", "Topical"
    LIQUID = "liquid", "Liquid"


class Cadence(models.TextChoices):
    DAILY = "daily", "Daily"
    WEEKLY = "weekly", "Weekly"
    MONTHLY = "monthly", "Monthly"
    QUARTERLY = "quarterly", "Every 3 months"
    AS_NEEDED = "as_needed", "As needed"


CADENCE_DAYS: dict[str, int | None] = {
    Cadence.DAILY: 1,
    Cadence.WEEKLY: 7,
    Cadence.MONTHLY: 30,
    Cadence.QUARTERLY: 90,
    Cadence.AS_NEEDED: None,
}


class Medication(models.Model):
    """An ongoing regimen. Individual doses are `MedicationDose` rows."""

    pet = models.ForeignKey(
        Pet, on_delete=models.CASCADE, related_name="medications"
    )
    name = models.CharField(max_length=160)
    detail = models.CharField(max_length=250, blank=True)
    form = models.CharField(
        max_length=16, choices=MedicationForm.choices, default=MedicationForm.PILL
    )
    cadence = models.CharField(
        max_length=16, choices=Cadence.choices, default=Cadence.MONTHLY
    )
    next_due_on = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_active", "next_due_on", "name", "id"]
        indexes = [models.Index(fields=["pet", "is_active"])]

    def __str__(self) -> str:
        return f"{self.name} for {self.pet_id}"

    @property
    def latest_dose(self) -> "MedicationDose | None":
        return self.doses.first()

    def advance_schedule(self, given_on: date) -> None:
        interval = CADENCE_DAYS.get(self.cadence)
        if interval is None:
            return
        self.next_due_on = given_on + timedelta(days=interval)
        self.save(update_fields=["next_due_on", "updated_at"])


class MedicationDose(models.Model):
    """A dose actually given — what "Log medication dose" writes."""

    medication = models.ForeignKey(
        Medication, on_delete=models.CASCADE, related_name="doses"
    )
    given_at = models.DateTimeField(default=timezone.now)
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-given_at", "-id"]
        indexes = [models.Index(fields=["medication", "-given_at"])]

    def __str__(self) -> str:
        return f"{self.medication_id} dose at {self.given_at:%Y-%m-%d %H:%M}"


class AppointmentStatus(models.TextChoices):
    BOOKED = "booked", "Booked"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class Appointment(models.Model):
    """A vet visit. `starts_at` is what the calendar export reads."""

    pet = models.ForeignKey(
        Pet, on_delete=models.CASCADE, related_name="appointments"
    )
    title = models.CharField(max_length=200)
    clinic = models.CharField(max_length=160, blank=True)
    vet_name = models.CharField(max_length=160, blank=True)
    vet_role = models.CharField(max_length=120, blank=True)
    starts_at = models.DateTimeField()
    address = models.CharField(max_length=250, blank=True)
    status = models.CharField(
        max_length=16,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.BOOKED,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at", "id"]
        indexes = [models.Index(fields=["pet", "starts_at"])]

    def __str__(self) -> str:
        return f"{self.title} for {self.pet_id} at {self.starts_at:%Y-%m-%d}"


class DocumentKind(models.TextChoices):
    LAB = "lab", "Lab result"
    INSURANCE = "insurance", "Insurance"
    CERTIFICATE = "certificate", "Certificate"
    OTHER = "other", "Other"


class PetDocument(models.Model):
    pet = models.ForeignKey(
        Pet, on_delete=models.CASCADE, related_name="documents"
    )
    label = models.CharField(max_length=200)
    kind = models.CharField(
        max_length=16, choices=DocumentKind.choices, default=DocumentKind.LAB
    )
    file = models.FileField(upload_to="pet-documents/%Y/%m/")
    note = models.CharField(max_length=250, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at", "-id"]
        indexes = [models.Index(fields=["pet", "-uploaded_at"])]

    def __str__(self) -> str:
        return f"{self.label} for {self.pet_id}"


class CareEventKind(models.TextChoices):
    WEIGHT = "weight", "Weight logged"
    DOSE = "dose", "Medication given"
    VACCINATION = "vaccination", "Vaccination recorded"
    APPOINTMENT = "appointment", "Appointment booked"
    DOCUMENT = "document", "Document uploaded"
    PET = "pet", "Pet added"


class CareEvent(models.Model):
    pet = models.ForeignKey(
        Pet, on_delete=models.CASCADE, related_name="care_events"
    )
    kind = models.CharField(max_length=16, choices=CareEventKind.choices)
    title = models.CharField(max_length=250)
    detail = models.CharField(max_length=400, blank=True)
    occurred_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-occurred_at", "-id"]
        indexes = [models.Index(fields=["pet", "-occurred_at"])]

    def __str__(self) -> str:
        return f"{self.get_kind_display()}: {self.title}"

    @classmethod
    def record(
        cls, pet: Pet, kind: str, title: str, detail: str = ""
    ) -> "CareEvent":
        """Single entry point, so every writer produces a consistent row."""
        return cls.objects.create(
            pet=pet, kind=kind, title=title[:250], detail=detail[:400]
        )
