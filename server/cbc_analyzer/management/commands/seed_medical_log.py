"""
Seed a demo Medical Log that reproduces the design mock's numbers.

The tiles on the Medical Log page are all derived — `total`, `normal` and
`abnormal` count the selected date window, `this_month` counts the current
calendar month, and the two percentages compare the window against the
preceding window of equal length.  So "make the page look like the mock" is
really a distribution problem: the records have to fall on the right dates, in
the right proportions, for the tiles to add up to 128 / 89 / 39 / 14.

Every record here goes through `evaluate_panel` exactly as a real save does, so
a seeded record's Low/High/Normal badge is *derived from its blood values*
rather than asserted.  Nothing in this file can produce a record the analyzer
itself would flag differently.

Usage:
    python manage.py seed_medical_log --email vet@example.com
    python manage.py seed_medical_log --email vet@example.com --flush
    python manage.py seed_medical_log --email vet@example.com --dry-run
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from cbc_analyzer.models import MedicalLog, NeuterStatus, Pet, Sex
from cbc_analyzer.reference import (
    PANEL,
    PANEL_BY_KEY,
    describe_flags,
    evaluate_panel,
    intervals_for,
)


# ── The numbers the mock shows ───────────────────────────────────────────────
# The date window the page opens on. Must match DEFAULT_DAYS in the client's
# MedicalLogView, or the tiles will count a window the table is not showing.
WINDOW_DAYS = 30

WINDOW_TOTAL = 128
WINDOW_NORMAL = 89
WINDOW_ABNORMAL = WINDOW_TOTAL - WINDOW_NORMAL  # 39
THIS_MONTH = 14

# Sized so the tiles' percentage changes read the way the mock does:
#   normal:   (89 - 79) / 79  = +12.7% -> displays +13%
#   abnormal: (39 - 40) / 40  =  -2.5% -> displays  -2%
#
# +12% exactly is unreachable while `normal` is pinned at 89 — it would need a
# baseline of 89/1.12 = 79.46 records — so the closest whole record count is
# used and the tile lands one point off the mock. 79 (+13%) is preferred over
# 80 (+11%) only because it errs on the same side as the mock's own arrow.
PREVIOUS_NORMAL = 79
PREVIOUS_ABNORMAL = 40
PREVIOUS_TOTAL = PREVIOUS_NORMAL + PREVIOUS_ABNORMAL


# ── The roster on the mock's first page ──────────────────────────────────────


@dataclass(frozen=True)
class SeedPet:
    name: str
    species: str
    breed: str
    age_years: str
    sex: str
    neuter_status: str
    owner_name: str


ROSTER: tuple[SeedPet, ...] = (
    SeedPet("Dusty", "canine", "Golden Retriever", "4.0", Sex.MALE, NeuterStatus.NEUTERED, "R. Alvarez"),
    SeedPet("Mittens", "feline", "Persian Cat", "7.5", Sex.FEMALE, NeuterStatus.SPAYED, "L. Tan"),
    SeedPet("Rex", "canine", "German Shepherd", "6.0", Sex.MALE, NeuterStatus.INTACT, "M. Okafor"),
    SeedPet("Luna", "canine", "Siberian Husky", "2.5", Sex.FEMALE, NeuterStatus.SPAYED, "J. Reyes"),
    SeedPet("Bella", "canine", "Labrador", "8.0", Sex.FEMALE, NeuterStatus.SPAYED, "K. Santos"),
    SeedPet("Simba", "feline", "Maine Coon", "3.0", Sex.MALE, NeuterStatus.NEUTERED, "P. Dela Cruz"),
    SeedPet("Cooper", "canine", "Beagle", "5.0", Sex.MALE, NeuterStatus.NEUTERED, "A. Villanueva"),
    SeedPet("Nala", "feline", "Siamese", "1.5", Sex.FEMALE, NeuterStatus.SPAYED, "T. Mendoza"),
)


# A blood-value recipe: which analytes to push out of range, and in which
# direction. `None` leaves the whole panel at its species midpoint.
@dataclass(frozen=True)
class Recipe:
    #: Free-text summary, as a clinician would write it on save.
    findings: str
    lows: tuple[str, ...] = ()
    highs: tuple[str, ...] = ()
    #: Analytes nudged toward — but not past — the top of their interval, so a
    #: "mild" observation reads as mild and still evaluates as normal.
    elevated_within_range: tuple[str, ...] = ()


# The mock's first page, newest first. Each recipe produces the status badge the
# screenshot shows, because the values genuinely flag that way.
FIRST_PAGE: tuple[tuple[int, Recipe], ...] = (
    # (days back from today, recipe)
    (0, Recipe("Mild Monocytosis, stress response", elevated_within_range=("mono_abs", "mono_pct"))),
    (1, Recipe("Moderate Anemia, low RBC/HGB", lows=("rbc", "hgb", "hct"))),
    (2, Recipe("Leukocytosis, high WBC count", highs=("wbc", "neut_seg_abs"))),
    (3, Recipe("Normal Panel, no abnormalities")),
    (4, Recipe("Mildly low platelet count", lows=("plt",))),
    (5, Recipe("Normal Panel, healthy indices")),
    (7, Recipe("Eosinophilia, suspected allergy", highs=("eos_abs", "eos_pct"))),
    (8, Recipe("Normal Panel, baseline record")),
)

# Recipes for the filler records behind page one. Their `findings` come from
# `describe_flags` instead, so the wording matches what the analyzer produced.
FILLER_NORMAL = Recipe("")
FILLER_ABNORMAL: tuple[Recipe, ...] = (
    Recipe("", lows=("rbc", "hgb")),
    Recipe("", highs=("wbc",)),
    Recipe("", lows=("plt",)),
    Recipe("", highs=("eos_abs", "eos_pct")),
    Recipe("", lows=("lymph_abs",)),
    Recipe("", highs=("mono_abs", "mono_pct")),
    Recipe("", lows=("hct",), highs=("wbc",)),
    Recipe("", highs=("plt",)),
)

CLINICAL_NOTES = (
    "Seeded demo record. Presented for a routine haematology screen; no acute "
    "signs reported by the owner at intake."
)


# ── Value construction ───────────────────────────────────────────────────────


def _midpoint(low: float | None, high: float | None) -> float | None:
    """The centre of an interval, or a plausible value for a one-sided one."""
    if low is not None and high is not None:
        return (low + high) / 2
    if high is not None:
        # Band neutrophils and basophils have no lower bound — a low-normal
        # value is the realistic reading, not half of the ceiling.
        return high * 0.3
    if low is not None:
        return low * 1.2
    return None


def _round_for(key: str, value: float) -> float | int:
    precision = PANEL_BY_KEY[key].precision
    if precision == 0:
        return int(round(value))
    return round(value, precision)


def build_values(species: str, recipe: Recipe) -> dict[str, float | int]:
    """
    A complete panel for `species`, perturbed per `recipe`.

    Optional analytes are left out: most in-house panels do not run reticulocyte
    counts, and omitting them keeps `missing_required` empty either way.
    """
    intervals = intervals_for(species)
    values: dict[str, float | int] = {}

    for analyte in PANEL:
        if analyte.optional:
            continue
        low, high = intervals.get(analyte.key, (None, None))
        centre = _midpoint(low, high)
        if centre is None:
            # No interval for this species; the analyzer would report it as not
            # assessed, which contributes nothing to the verdict either way.
            continue
        values[analyte.key] = _round_for(analyte.key, centre)

    for key in recipe.elevated_within_range:
        low, high = intervals.get(key, (None, None))
        if high is None:
            continue
        # 6% below the ceiling: clearly elevated, still inside the interval.
        values[key] = _round_for(key, high * 0.94)

    for key in recipe.lows:
        low, high = intervals.get(key, (None, None))
        if low is None:
            continue
        values[key] = _round_for(key, low * 0.82)

    for key in recipe.highs:
        low, high = intervals.get(key, (None, None))
        if high is None:
            continue
        values[key] = _round_for(key, high * 1.22)

    return values


# ── Date planning ────────────────────────────────────────────────────────────


@dataclass
class Plan:
    """One record to create: when, for whom, and with what recipe."""

    test_date: date
    pet_index: int
    recipe: Recipe
    #: True for the mock's first page, whose findings text is authored above.
    verbatim_findings: bool


def spread(start: date, end: date, count: int) -> list[date]:
    """
    `count` dates spread as evenly as possible across an inclusive range.

    Ranges here are often shorter than the number of records they hold — 114
    records over the tail of last month — so days repeat rather than overflow
    the range and land outside the window they were sized for.
    """
    if count <= 0:
        return []
    span = (end - start).days + 1
    if span <= 0:
        raise ValueError("empty date range")
    # Walk newest-first so the densest days sit at the recent end, the way a
    # real clinic's log fills in.
    return [end - timedelta(days=index % span) for index in range(count)]


def build_plan(today: date) -> tuple[list[Plan], list[str]]:
    """The full seed, plus any warnings about numbers today's date cannot hit."""
    warnings: list[str] = []
    plans: list[Plan] = []

    window_start = today - timedelta(days=WINDOW_DAYS)
    month_start = today.replace(day=1)
    previous_end = window_start - timedelta(days=1)
    previous_start = window_start - timedelta(days=WINDOW_DAYS)

    # ── Page one: the eight rows in the screenshot ───────────────────────────
    for offset, recipe in FIRST_PAGE:
        plans.append(
            Plan(
                test_date=today - timedelta(days=offset),
                pet_index=len(plans) % len(ROSTER),
                recipe=recipe,
                verbatim_findings=True,
            )
        )
    first_page_abnormal = sum(
        1 for _, recipe in FIRST_PAGE if recipe.lows or recipe.highs
    )
    first_page_normal = len(FIRST_PAGE) - first_page_abnormal

    # ── The rest of the current calendar month, up to `this_month` ───────────
    first_page_dates = [plan.test_date for plan in plans]
    oldest_first_page = min(first_page_dates)
    first_page_in_month = sum(1 for d in first_page_dates if d >= month_start)
    in_month_remaining = THIS_MONTH - first_page_in_month
    in_month_end = oldest_first_page - timedelta(days=1)
    if in_month_remaining > 0 and in_month_end < month_start:
        warnings.append(
            f"The mock's first page reaches back to {oldest_first_page:%b %d}, "
            f"before {month_start:%B} began, so only {first_page_in_month} "
            f"record(s) land in this calendar month. The 'This month' tile "
            f"will read {first_page_in_month}, not {THIS_MONTH}. Re-run when "
            "the month is at least 9 days old to match the mock exactly."
        )
        in_month_remaining = 0
    in_month_dates = (
        spread(month_start, in_month_end, in_month_remaining)
        if in_month_remaining > 0
        else []
    )

    # ── The remainder of the window, dated before this month began ──────────
    pre_month_count = WINDOW_TOTAL - len(FIRST_PAGE) - len(in_month_dates)
    pre_month_end = month_start - timedelta(days=1)
    if pre_month_end < window_start:
        # Late in a 31-day month the whole window can sit inside the month, so
        # there is nowhere to put a record that counts toward the window but not
        # toward "this month".
        warnings.append(
            f"The {WINDOW_DAYS}-day window is entirely inside "
            f"{month_start:%B}, so all {WINDOW_TOTAL} window records also fall "
            f"in this month; the 'This month' tile will read far above "
            f"{THIS_MONTH}. Re-run early in a month to match the mock exactly."
        )
        pre_month_dates = spread(window_start, today, pre_month_count)
    else:
        pre_month_dates = spread(window_start, pre_month_end, pre_month_count)

    # ── Status mix: the window must land on 89 normal / 39 abnormal ──────────
    window_dates = in_month_dates + pre_month_dates
    plans += _assign(
        window_dates,
        normal=WINDOW_NORMAL - first_page_normal,
        abnormal=WINDOW_ABNORMAL - first_page_abnormal,
        pet_offset=len(plans),
    )

    # ── The preceding window, which only the percentages read ───────────────
    plans += _assign(
        spread(previous_start, previous_end, PREVIOUS_TOTAL),
        normal=PREVIOUS_NORMAL,
        abnormal=PREVIOUS_ABNORMAL,
        pet_offset=len(plans),
    )

    return plans, warnings


def _assign(
    dates: list[date], *, normal: int, abnormal: int, pet_offset: int
) -> list[Plan]:
    """
    Turn dates into plans holding exactly `normal` normal and `abnormal`
    flagged records, interleaved so no single day is all one verdict.
    """
    if normal + abnormal != len(dates):
        raise ValueError(
            f"status mix ({normal} + {abnormal}) does not match "
            f"{len(dates)} dates"
        )

    plans: list[Plan] = []
    normal_left, abnormal_left = normal, abnormal
    for index, test_date in enumerate(dates):
        # Deal abnormals out at a steady rate rather than in a block, so the
        # table reads like a real log at any date range.
        take_abnormal = abnormal_left > 0 and (
            normal_left == 0
            or (index * abnormal) // max(len(dates), 1)
            != ((index + 1) * abnormal) // max(len(dates), 1)
        )
        if take_abnormal:
            recipe = FILLER_ABNORMAL[index % len(FILLER_ABNORMAL)]
            abnormal_left -= 1
        else:
            recipe = FILLER_NORMAL
            normal_left -= 1
        plans.append(
            Plan(
                test_date=test_date,
                pet_index=(pet_offset + index) % len(ROSTER),
                recipe=recipe,
                verbatim_findings=False,
            )
        )
    return plans


# ── Command ──────────────────────────────────────────────────────────────────


class Command(BaseCommand):
    help = (
        "Seed the Medical Log with the demo records from the design mock "
        "(128 records in the last 30 days, 89 normal / 39 abnormal)."
    )

    def add_arguments(self, parser):
        # Emails are not unique in this project — one person's sign-ups produce
        # several accounts sharing an address — so an id is the only selector
        # guaranteed to identify a single one.
        target = parser.add_mutually_exclusive_group(required=True)
        target.add_argument(
            "--email",
            help=(
                "Email of the account the records belong to. Rejected when it "
                "matches more than one account; use --user-id instead."
            ),
        )
        target.add_argument(
            "--user-id",
            type=int,
            help="Primary key of the account the records belong to.",
        )
        parser.add_argument(
            "--flush",
            action="store_true",
            help=(
                "Delete this account's existing records for the seed roster "
                "(Dusty, Mittens, Rex, Luna, Bella, Simba, Cooper, Nala) "
                "before seeding, including the pets themselves."
            ),
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be written without touching the database.",
        )

    def handle(self, *args, **options):
        user = self._resolve_user(options)
        label = f"{user.email} (id {user.pk})"

        profile = getattr(user, "profile", None)
        if not profile or profile.user_type != "professional":
            # Not fatal: the records are valid either way, but the page itself
            # is gated on the profile type, so say so rather than let them
            # wonder why the log 403s.
            self.stdout.write(
                self.style.WARNING(
                    f"{label} is not a Veterinary Professional profile "
                    f"(user_type={getattr(profile, 'user_type', None)!r}). "
                    "The records will be created, but the Medical Log page is "
                    "gated on that profile type and will refuse to show them."
                )
            )

        # Anything already on the account is counted by the same tiles, so it
        # has to be accounted for before the totals can be trusted. Records for
        # the seed roster are replaceable; anything else is the account's own
        # data and is never touched.
        owned = MedicalLog.objects.filter(user=user)
        roster_names = [pet.name for pet in ROSTER]
        roster_existing = owned.filter(pet_name__in=roster_names).count()
        other_existing = owned.exclude(pet_name__in=roster_names).count()

        if roster_existing and not options["flush"]:
            raise CommandError(
                f"{label} already has {roster_existing} record(s) for the seed "
                "roster. Re-run with --flush to replace them, or seed a clean "
                "demo account."
            )
        if other_existing:
            self.stdout.write(
                self.style.WARNING(
                    f"{label} has {other_existing} record(s) outside the seed "
                    "roster. Those are left alone — this command never deletes "
                    "an account's own patients — but the tiles count them too, "
                    "so the totals will read up to "
                    f"{other_existing} above the mock's."
                )
            )

        today = timezone.localdate()
        plans, warnings = build_plan(today)
        for warning in warnings:
            self.stdout.write(self.style.WARNING(warning))

        if options["dry_run"]:
            self._report(user, plans, today, dry_run=True)
            return

        with transaction.atomic():
            if options["flush"]:
                self._flush(user)
            pets = self._ensure_pets(user)
            for plan in plans:
                self._create_log(user, pets, plan)

        self._report(user, plans, today, dry_run=False)

    # ── Steps ───────────────────────────────────────────────────────────────

    def _resolve_user(self, options):
        User = get_user_model()
        if options.get("user_id") is not None:
            try:
                return User.objects.get(pk=options["user_id"])
            except User.DoesNotExist:
                raise CommandError(f"No account with id {options['user_id']}.")

        email = options["email"].strip()
        matches = list(
            User.objects.filter(email__iexact=email).select_related("profile")
        )
        if not matches:
            raise CommandError(f"No account found for {email!r}.")
        if len(matches) == 1:
            return matches[0]

        # Several accounts share this address, and picking one silently could
        # seed 247 records onto the wrong profile.
        listing = "\n".join(
            f"    --user-id {candidate.pk}"
            f"   {self._user_type(candidate):<13}"
            f"  {candidate.get_username()}"
            for candidate in matches
        )
        raise CommandError(
            f"{email!r} matches {len(matches)} accounts. Re-run with the id of "
            f"the one you mean:\n{listing}"
        )

    @staticmethod
    def _user_type(user) -> str:
        """The account's profile type, or a placeholder when it has none."""
        profile = getattr(user, "profile", None)
        return getattr(profile, "user_type", None) or "unset"

    def _flush(self, user) -> None:
        names = [pet.name for pet in ROSTER]
        pets = Pet.objects.filter(user=user, name__in=names)
        # Logs snapshot the patient, so clear them by name as well — a record
        # whose pet was deleted earlier is unlinked but still counts on the
        # tiles.
        logs = MedicalLog.objects.filter(user=user, pet_name__in=names)
        log_count = logs.count()
        pet_count = pets.count()
        logs.delete()
        pets.delete()
        self.stdout.write(
            f"Flushed {log_count} record(s) and {pet_count} pet(s)."
        )

    def _ensure_pets(self, user) -> list[Pet]:
        pets: list[Pet] = []
        for seed in ROSTER:
            pet, _ = Pet.objects.update_or_create(
                user=user,
                name=seed.name,
                defaults={
                    "species": seed.species,
                    "breed": seed.breed,
                    "age_years": seed.age_years,
                    "sex": seed.sex,
                    "neuter_status": seed.neuter_status,
                    "owner_name": seed.owner_name,
                },
            )
            pets.append(pet)
        return pets

    def _create_log(self, user, pets: list[Pet], plan: Plan) -> MedicalLog:
        pet = pets[plan.pet_index]
        values = build_values(pet.species, plan.recipe)
        evaluation = evaluate_panel(values, pet.species)

        # The tile arithmetic assumes every perturbed recipe actually flags. A
        # bound of exactly zero — feline monocytes, say — would swallow a "low"
        # perturbation and quietly turn an abnormal record normal, throwing the
        # 89/39 split off. Fail loudly instead of seeding numbers that disagree
        # with the plan.
        wanted_flag = bool(plan.recipe.lows or plan.recipe.highs)
        if wanted_flag != (evaluation["result_status"] != "normal"):
            raise CommandError(
                f"Recipe for {pet.name} ({pet.species}) evaluated as "
                f"{evaluation['result_status']!r}, but the plan counted it as "
                f"{'abnormal' if wanted_flag else 'normal'}. "
                f"lows={plan.recipe.lows} highs={plan.recipe.highs}"
            )

        findings = (
            plan.recipe.findings
            if plan.verbatim_findings
            else describe_flags(evaluation["flags"])
        )
        log = MedicalLog(
            user=user,
            pet=pet,
            pet_name=pet.name,
            species=pet.species,
            species_label=pet.species_label,
            breed=pet.breed,
            age_years=pet.age_years,
            sex=pet.sex,
            neuter_status=pet.neuter_status,
            owner_name=pet.owner_name,
            test_type=MedicalLog.TEST_TYPE_CBC,
            test_date=plan.test_date,
            values=values,
            evaluation=evaluation,
            result_status=evaluation["result_status"],
            flag_count=len(evaluation["flags"]),
            key_findings=findings[:255],
            clinical_notes=CLINICAL_NOTES,
            vet_name=(user.get_full_name() or user.get_username()),
        )
        # Not bulk_create: record_id is minted in save(), and bulk_create would
        # leave every seeded record with a blank one.
        log.save()
        return log

    def _report(self, user, plans: list[Plan], today: date, *, dry_run: bool) -> None:
        window_start = today - timedelta(days=WINDOW_DAYS)
        month_start = today.replace(day=1)

        # Recompute the tiles the way the API does, from the planned records, so
        # a mismatch shows up here rather than on the page.
        in_window = [p for p in plans if p.test_date >= window_start]
        abnormal = [p for p in in_window if p.recipe.lows or p.recipe.highs]
        this_month = [p for p in plans if p.test_date >= month_start]

        verb = "Would create" if dry_run else "Created"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} {len(plans)} record(s) across {len(ROSTER)} pet(s) "
                f"for {user.email} (id {user.pk})."
            )
        )
        self.stdout.write(
            "  Tiles on the default Last 30 Days view: "
            f"total {len(in_window)}, "
            f"normal {len(in_window) - len(abnormal)}, "
            f"abnormal {len(abnormal)}, "
            f"this month {len(this_month)}"
        )
        self.stdout.write(f"  Mock: total 128, normal 89, abnormal 39, this month 14")
