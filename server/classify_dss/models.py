import uuid

from django.conf import settings
from django.db import models


class ClassificationThrottleMeta(models.Model):
    scope = models.CharField(max_length=64)
    ident = models.CharField(max_length=255)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    user_first_name = models.CharField(max_length=150, blank=True)
    last_seen_ph = models.DateTimeField()
    next_reset_ph = models.DateTimeField()
    bucket_hours = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("scope", "ident")
        indexes = [
            models.Index(fields=["scope", "ident"]),
        ]

    def __str__(self):
        return f"{self.scope}:{self.ident}"


class ClassificationRecord(models.Model):
    """What the AI answered for one classification, and what the user said back.

    Saved for every successful run so accuracy can be measured. On its own it
    holds no photo, no notes, and no link to the account — only the answer and
    the circumstances it was given in. The photo and notes are kept only when
    the user ticks the box to share them with their feedback.
    """

    class Kind(models.TextChoices):
        DISEASE = "disease", "Disease classification"
        BREED = "breed", "Breed identification"

    class Outcome(models.TextChoices):
        DIAGNOSTIC = "diagnostic", "Answer given"
        HEALTHY = "healthy", "Judged healthy"
        NOT_ANIMAL = "not_animal", "No animal in the photo"
        NOT_IDENTIFIED = "not_identified", "Could not identify"

    class Verdict(models.TextChoices):
        CORRECT = "correct", "Correct"
        PARTLY = "partly", "Partly correct"
        INCORRECT = "incorrect", "Incorrect"
        UNSURE = "unsure", "Not sure yet"

    class ConfirmedBy(models.TextChoices):
        VET_EXAM = "vet_exam", "Vet examination"
        LAB_TEST = "lab_test", "Lab test"
        INSTRUCTOR = "instructor", "Instructor"
        OWN_JUDGEMENT = "own_judgement", "Own judgement"
        PAPERS = "papers", "Pedigree papers or DNA test"
        RECORDS = "records", "Breeder or shelter records"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # What was asked
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.DISEASE)
    mode = models.CharField(max_length=16)
    had_image = models.BooleanField(default=False)
    had_notes = models.BooleanField(default=False)
    model_name = models.CharField(max_length=80, blank=True)
    prompt_version = models.CharField(max_length=40, blank=True)

    # What the AI answered: the condition, or the breed for a breed run. For a
    # disease it is the clinical name in every mode — the pet-owner answer is
    # built on the professional one — so ratings from all three roles count
    # towards the same condition.
    outcome = models.CharField(max_length=16, choices=Outcome.choices)
    animal_type = models.CharField(max_length=60, blank=True)
    diagnosis = models.CharField(max_length=240, blank=True)
    confidence = models.PositiveSmallIntegerField(null=True, blank=True)

    # What the user said back
    verdict = models.CharField(
        max_length=16, choices=Verdict.choices, blank=True
    )
    actual_diagnosis = models.CharField(max_length=240, blank=True)
    confirmed_by = models.CharField(
        max_length=16, choices=ConfirmedBy.choices, blank=True
    )
    feedback_at = models.DateTimeField(null=True, blank=True)

    # Only when the user opted in
    shared = models.BooleanField(default=False)
    shared_image_url = models.URLField(max_length=500, blank=True)
    shared_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["verdict"]),
            models.Index(fields=["diagnosis"]),
        ]

    def __str__(self):
        return f"{self.diagnosis or self.outcome} ({self.verdict or 'no feedback'})"


class FeedbackReminder(models.Model):
    """A user asked to be reminded to rate a result once they know the answer.

    The one place a classification is tied to an account, and only because the
    user ticked the box asking for it. Deleted once they answer or dismiss it.
    """

    record = models.OneToOneField(
        ClassificationRecord, on_delete=models.CASCADE, related_name="reminder"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feedback_reminders",
    )
    remind_at = models.DateTimeField()
    notified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["remind_at"]
        indexes = [models.Index(fields=["user", "remind_at"])]

    def __str__(self):
        return f"{self.user} — {self.record.diagnosis} at {self.remind_at:%Y-%m-%d}"
