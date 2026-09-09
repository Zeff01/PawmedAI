"""Load or refresh the case library from `academy/cases/*.json`.

Idempotent: re-running updates the text of existing cases in place rather than
duplicating them, and student attempts survive because a case is matched on its
slug. Stages are rebuilt each run, so editing a stage in a case file and
re-seeding will clear answers recorded against that case — say so before doing it
on a live database.

    python manage.py seed_cases              # load every case file
    python manage.py seed_cases --check      # validate only, touch nothing
    python manage.py seed_cases --species    # list the species vocabulary
    python manage.py seed_cases --prune      # also delete cases no file defines
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from academy.case_library import CASES_DIR, CaseLibraryError, load_cases
from academy.models import Case, CaseOption, CaseStage


class Command(BaseCommand):
    help = "Create or update the student academy cases defined in academy/cases/."

    def add_arguments(self, parser):
        parser.add_argument(
            "--prune",
            action="store_true",
            help="Delete cases that no longer have a file in academy/cases/.",
        )
        parser.add_argument(
            "--check",
            action="store_true",
            help="Validate the case files and report, without writing anything.",
        )
        parser.add_argument(
            "--species",
            action="store_true",
            help="List the species terms a case file may use, and exit.",
        )
        parser.add_argument(
            "--dir",
            dest="directory",
            default=None,
            help=f"Read case files from this directory instead of {CASES_DIR}.",
        )

    def handle(self, *args, **options):
        if options["species"]:
            for value, label in Case.Species.choices:
                self.stdout.write(f"  {value:<12} {label}")
            self.stdout.write(
                self.style.SUCCESS(f"{len(Case.Species.choices)} species terms.")
            )
            return

        try:
            cases = load_cases(options["directory"])
        except CaseLibraryError as exc:
            # The loader's message already names the file and the field; a
            # traceback on top of it would only bury the useful line.
            raise CommandError(str(exc)) from exc

        if options["check"]:
            for case in cases:
                points = (
                    sum(stage["points"] for stage in case["stages"])
                    + case["completion_bonus"]
                )
                self.stdout.write(
                    f"OK {case['slug']} ({len(case['stages'])} stages, {points} points)"
                )
            self.stdout.write(
                self.style.SUCCESS(f"{len(cases)} case files are valid.")
            )
            return

        self._seed(cases, prune=options["prune"])

    @transaction.atomic
    def _seed(self, cases, *, prune: bool) -> None:
        for case_payload in cases:
            stages = case_payload["stages"]
            slug = case_payload["slug"]

            case, created = Case.objects.update_or_create(
                slug=slug,
                defaults={
                    key: value
                    for key, value in case_payload.items()
                    if key not in ("slug", "stages")
                },
            )

            # Rebuild the stages wholesale: an in-place update would have to
            # reconcile options one by one, and the case file is the source of
            # truth for them anyway.
            case.stages.all().delete()

            for index, stage_payload in enumerate(stages, start=1):
                stage = CaseStage.objects.create(
                    case=case,
                    order=index,
                    kind=stage_payload["kind"],
                    title=stage_payload["title"],
                    briefing=stage_payload["briefing"],
                    prompt=stage_payload["prompt"],
                    select_mode=stage_payload["select_mode"],
                    points=stage_payload["points"],
                    explanation=stage_payload["explanation"],
                )
                CaseOption.objects.bulk_create(
                    [
                        CaseOption(
                            stage=stage,
                            order=option_index,
                            label=option["label"],
                            detail=option["detail"],
                            is_correct=option["is_correct"],
                        )
                        for option_index, option in enumerate(
                            stage_payload["options"], start=1
                        )
                    ]
                )

            self.stdout.write(
                f"{'Created' if created else 'Updated'} {slug} "
                f"({len(stages)} stages, {case.total_points} points)"
            )

        if prune:
            seeded_slugs = [case["slug"] for case in cases]
            removed, _ = Case.objects.exclude(slug__in=seeded_slugs).delete()
            if removed:
                self.stdout.write(self.style.WARNING(f"Pruned {removed} rows"))

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(cases)} cases."))
