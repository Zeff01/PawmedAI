"""Case-based learning for Veterinary Student accounts.

A case is worked in ordered stages — read the history, choose diagnostics, rank
differentials, commit to a diagnosis — and each stage is scored on its own. That
is why progress is a percentage rather than a pass/fail: a student who has
cleared the workup but not yet committed to a diagnosis is genuinely two thirds
of the way through, and the dashboard says so.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


class Case(models.Model):
    """One simulated patient a student works through."""

    class Species(models.TextChoices):
        """The patient's species, by its clinical adjective.

        Grouped the way a curriculum is taught — companion animals, farm and
        equine, birds, reptiles and amphibians, aquatic, then everything else.
        Several terms nest (a parrot is `psittacine` and also `avian`, a
        guinea pig is `caviine` and also a rodent): tag a case with the most
        specific term that fits, and use the broader one when nothing fits.
        `exotic` and `wildlife` are the last resorts.
        """

        # Companion animals
        CANINE = "canine", "Canine (dog)"
        FELINE = "feline", "Feline (cat)"
        LAPINE = "lapine", "Lapine (rabbit)"
        MUSTELINE = "musteline", "Musteline (ferret)"
        CAVIINE = "caviine", "Caviine (guinea pig)"
        MURINE = "murine", "Murine (rat, mouse)"
        RODENT = "rodent", "Rodent (hamster, gerbil, chinchilla)"

        # Equine, farm and production
        EQUINE = "equine", "Equine (horse)"
        ASININE = "asinine", "Asinine (donkey, mule)"
        BOVINE = "bovine", "Bovine (cattle)"
        OVINE = "ovine", "Ovine (sheep)"
        CAPRINE = "caprine", "Caprine (goat)"
        PORCINE = "porcine", "Porcine (pig)"
        CAMELID = "camelid", "Camelid (llama, alpaca)"
        CERVINE = "cervine", "Cervine (deer)"

        # Birds
        AVIAN = "avian", "Avian (bird, unspecified)"
        PSITTACINE = "psittacine", "Psittacine (parrot, budgie, cockatiel)"
        PASSERINE = "passerine", "Passerine (canary, finch)"
        GALLIFORM = "galliform", "Galliform (chicken, turkey)"
        ANSERIFORM = "anseriform", "Anseriform (duck, goose)"
        COLUMBINE = "columbine", "Columbine (pigeon, dove)"
        RAPTOR = "raptor", "Raptor (hawk, falcon, owl)"

        # Reptiles and amphibians
        REPTILIAN = "reptilian", "Reptilian (reptile, unspecified)"
        CHELONIAN = "chelonian", "Chelonian (tortoise, turtle)"
        OPHIDIAN = "ophidian", "Ophidian (snake)"
        SAURIAN = "saurian", "Saurian (lizard, gecko)"
        CROCODILIAN = "crocodilian", "Crocodilian (crocodile, alligator)"
        AMPHIBIAN = "amphibian", "Amphibian (frog, salamander, axolotl)"

        # Aquatic
        PISCINE = "piscine", "Piscine (fish)"
        CETACEAN = "cetacean", "Cetacean (whale, dolphin)"
        PINNIPED = "pinniped", "Pinniped (seal, sea lion)"

        # Everything else
        PRIMATE = "primate", "Primate (non-human)"
        MARSUPIAL = "marsupial", "Marsupial (kangaroo, wombat, possum)"
        APIAN = "apian", "Apian (honeybee)"
        WILDLIFE = "wildlife", "Wildlife (unspecified)"
        EXOTIC = "exotic", "Exotic (unspecified)"

    class Difficulty(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    slug = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=200)
    species = models.CharField(max_length=16, choices=Species.choices)
    discipline = models.CharField(
        max_length=120,
        help_text="Clinical discipline, e.g. 'Emergency & Critical Care'.",
    )
    difficulty = models.CharField(max_length=16, choices=Difficulty.choices)
    body_system = models.CharField(max_length=120)
    presentation = models.TextField(
        help_text="The signalment and presenting complaint, shown on the card."
    )
    completion_bonus = models.PositiveIntegerField(
        default=25,
        help_text="Awarded once, when every stage of the case is correct.",
    )
    is_published = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.title

    @property
    def total_points(self) -> int:
        """Everything on offer: every stage, plus the completion bonus."""
        staged = sum(stage.points for stage in self.stages.all())
        return staged + self.completion_bonus


class CaseStage(models.Model):
    """One scored step of a case."""

    class Kind(models.TextChoices):
        HISTORY = "history", "History & signalment"
        DIAGNOSTICS = "diagnostics", "Diagnostic plan"
        DIFFERENTIAL = "differential", "Differential ranking"
        DIAGNOSIS = "diagnosis", "Final diagnosis"

    class SelectMode(models.TextChoices):
        SINGLE = "single", "One answer"
        MULTI = "multi", "Several answers"

    case = models.ForeignKey(
        Case, on_delete=models.CASCADE, related_name="stages"
    )
    order = models.PositiveSmallIntegerField()
    kind = models.CharField(max_length=16, choices=Kind.choices)
    title = models.CharField(max_length=160)
    briefing = models.TextField(
        blank=True,
        help_text="Clinical detail released at this stage — vitals, lab values, "
        "imaging notes. Shown above the question.",
    )
    prompt = models.CharField(max_length=300)
    select_mode = models.CharField(
        max_length=8, choices=SelectMode.choices, default=SelectMode.SINGLE
    )
    points = models.PositiveIntegerField(default=10)
    explanation = models.TextField(
        help_text="The teaching point, shown once the stage is answered."
    )

    class Meta:
        ordering = ["order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["case", "order"], name="academy_stage_order_unique"
            )
        ]

    def __str__(self) -> str:
        return f"{self.case.slug} · {self.order}. {self.title}"

    def correct_option_ids(self) -> set[int]:
        return {
            option.id for option in self.options.all() if option.is_correct
        }


class CaseOption(models.Model):
    """One answer a student can pick at a stage.

    `is_correct` is never serialized to the client while a stage is unanswered —
    the answer endpoint is the only thing that reveals it.
    """

    stage = models.ForeignKey(
        CaseStage, on_delete=models.CASCADE, related_name="options"
    )
    order = models.PositiveSmallIntegerField(default=0)
    label = models.CharField(max_length=240)
    detail = models.CharField(max_length=300, blank=True)
    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.label


class CaseAttempt(models.Model):
    """A student's run at one case. One per student per case."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="case_attempts",
    )
    case = models.ForeignKey(
        Case, on_delete=models.CASCADE, related_name="attempts"
    )
    points_earned = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "case"], name="academy_attempt_unique"
            )
        ]

    def __str__(self) -> str:
        return f"{self.user_id} · {self.case.slug}"

    def cleared_stage_ids(self) -> set[int]:
        """Stages the student may move past — solved, or given up on."""
        return {
            stage_attempt.stage_id
            for stage_attempt in self.stage_attempts.all()
            if stage_attempt.is_correct or stage_attempt.revealed
        }

    def solved_stage_ids(self) -> set[int]:
        """Stages the student actually got right, unaided."""
        return {
            stage_attempt.stage_id
            for stage_attempt in self.stage_attempts.all()
            if stage_attempt.is_correct
        }

    def refresh_completion(self) -> int:
        """Stamp the attempt complete once every stage is cleared.

        Returns the bonus awarded by this call — zero when the case was already
        complete, and zero when the student needed an answer revealed to get
        here. Finishing is progress; finishing unaided is what earns the bonus.
        """
        if self.completed_at:
            return 0

        stage_ids = {stage.id for stage in self.case.stages.all()}
        if not stage_ids or not stage_ids.issubset(self.cleared_stage_ids()):
            return 0

        bonus = (
            self.case.completion_bonus
            if stage_ids.issubset(self.solved_stage_ids())
            else 0
        )
        self.completed_at = timezone.now()
        self.points_earned += bonus
        self.save(update_fields=["completed_at", "points_earned", "updated_at"])
        return bonus


class StageAttempt(models.Model):
    """A student's answer to one stage.

    Kept even when wrong: a second try is worth less than a first, and the
    dashboard's accuracy figure is first-try answers over answers given.
    """

    attempt = models.ForeignKey(
        CaseAttempt, on_delete=models.CASCADE, related_name="stage_attempts"
    )
    stage = models.ForeignKey(
        CaseStage, on_delete=models.CASCADE, related_name="student_answers"
    )
    selected_option_ids = models.JSONField(default=list)
    is_correct = models.BooleanField(default=False)
    revealed = models.BooleanField(
        default=False,
        help_text="The model answer was shown after repeated wrong attempts. "
        "The stage unlocks the next one but earns nothing.",
    )
    tries = models.PositiveSmallIntegerField(default=0)
    points_earned = models.PositiveIntegerField(default=0)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["stage__order"]
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "stage"],
                name="academy_stage_attempt_unique",
            )
        ]

    def __str__(self) -> str:
        return f"{self.attempt_id} · stage {self.stage_id}"

    @property
    def first_try_correct(self) -> bool:
        return self.is_correct and self.tries == 1

    @property
    def is_cleared(self) -> bool:
        return self.is_correct or self.revealed
