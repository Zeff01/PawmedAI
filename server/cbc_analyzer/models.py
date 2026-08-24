from django.conf import settings
from django.db import IntegrityError, models, transaction
from django.utils import timezone

from cbc_analyzer.reference import RESULT_STATUS_CHOICES, SPECIES_CHOICES


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
    """
    A patient on a veterinary professional's own roster.

    Pets are scoped to the clinician who created them — one vet never sees
    another vet's patient list — which is why every query in this app filters on
    `user` rather than relying on object-level permissions.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cbc_pets",
    )
    name = models.CharField(max_length=120)
    species = models.CharField(max_length=16, choices=SPECIES_CHOICES)
    #: Free-text species label when `species` is "other" (e.g. "rabbit").
    species_label = models.CharField(max_length=60, blank=True)
    breed = models.CharField(max_length=120, blank=True)
    age_years = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    sex = models.CharField(
        max_length=16, choices=Sex.choices, default=Sex.UNKNOWN
    )
    neuter_status = models.CharField(
        max_length=16, choices=NeuterStatus.choices, default=NeuterStatus.UNKNOWN
    )
    owner_name = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name", "id"]
        indexes = [
            models.Index(fields=["user", "name"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_species_display()})"

    @property
    def species_display(self) -> str:
        if self.species == "other" and self.species_label:
            return self.species_label
        return self.get_species_display()


class MedicalLog(models.Model):
    """
    One saved CBC analysis.

    A log may or may not be bound to a `Pet`: the save flow lets a clinician keep
    a result as a standalone record when the patient has no profile yet.  The
    patient context is therefore duplicated onto the log as a snapshot, so the
    record still reads correctly if the pet is later renamed or deleted.
    """

    TEST_TYPE_CBC = "cbc_panel"

    RECORD_ID_ATTEMPTS = 5

    record_id = models.CharField(max_length=32, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cbc_medical_logs",
    )
    pet = models.ForeignKey(
        Pet,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="medical_logs",
    )

    # ── Patient snapshot ────────────────────────────────────────────────────
    pet_name = models.CharField(max_length=120, blank=True)
    species = models.CharField(max_length=16, choices=SPECIES_CHOICES)
    species_label = models.CharField(max_length=60, blank=True)
    breed = models.CharField(max_length=120, blank=True)
    age_years = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    sex = models.CharField(
        max_length=16, choices=Sex.choices, default=Sex.UNKNOWN
    )
    neuter_status = models.CharField(
        max_length=16, choices=NeuterStatus.choices, default=NeuterStatus.UNKNOWN
    )
    owner_name = models.CharField(max_length=120, blank=True)

    # ── Test payload ────────────────────────────────────────────────────────
    test_type = models.CharField(max_length=32, default=TEST_TYPE_CBC)
    test_date = models.DateField(default=timezone.localdate)
    values = models.JSONField(default=dict)
    evaluation = models.JSONField(default=dict)
    result_status = models.CharField(
        max_length=16, choices=RESULT_STATUS_CHOICES, default="normal"
    )
    flag_count = models.PositiveSmallIntegerField(default=0)
    key_findings = models.CharField(max_length=255, blank=True)
    diagnostic_brief = models.TextField(blank=True)

    # ── Supporting context ──────────────────────────────────────────────────
    sample_quality = models.JSONField(default=list, blank=True)
    smear_morphology = models.TextField(blank=True)
    clinical_notes = models.TextField(blank=True)
    vet_name = models.CharField(max_length=120, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-test_date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "-test_date"]),
            models.Index(fields=["user", "result_status"]),
            models.Index(fields=["pet", "-test_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.record_id} — {self.pet_name or 'unlinked'}"

    def save(self, *args, **kwargs):
        if self.record_id:
            super().save(*args, **kwargs)
            return

        last_attempt = self.RECORD_ID_ATTEMPTS - 1
        for attempt in range(self.RECORD_ID_ATTEMPTS):
            self.record_id = self._generate_record_id()
            try:
                with transaction.atomic():
                    super().save(*args, **kwargs)
                return
            except IntegrityError:
                if attempt == last_attempt:
                    raise
                self.record_id = ""

    def _generate_record_id(self) -> str:
        """
        Build a human-quotable id of the form ``RCBC-2026-0212-001``.

        The suffix counts records saved on the same calendar day across the whole
        table, so an id is unique and quotable over the phone without leaking how
        many records a particular clinic holds.
        """
        today = timezone.localdate()
        prefix = f"RCBC-{today:%Y-%m%d}"
        existing = (
            MedicalLog.objects.filter(record_id__startswith=prefix)
            .order_by("-record_id")
            .values_list("record_id", flat=True)
            .first()
        )
        sequence = 1
        if existing:
            try:
                sequence = int(existing.rsplit("-", 1)[1]) + 1
            except (IndexError, ValueError):
                sequence = (
                    MedicalLog.objects.filter(
                        record_id__startswith=prefix
                    ).count()
                    + 1
                )
        return f"{prefix}-{sequence:03d}"

    @property
    def species_display(self) -> str:
        if self.species == "other" and self.species_label:
            return self.species_label
        return self.get_species_display()
