"""
Fills one owner's household with a believable starting record.

    ./manage.py seed_pet_profiles --email owner@example.com
"""

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from pet_profiles.models import (
    Appointment,
    Cadence,
    CareEvent,
    CareEventKind,
    Medication,
    MedicationDose,
    Pet,
    Vaccination,
    WeightEntry,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Give one owner a starter household of pets and care records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            help="The owner's email address, as stored on the Django user.",
        )
        parser.add_argument(
            "--username",
            help="The owner's username (a Supabase UID for real accounts).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete this owner's existing pets first.",
        )

    def handle(self, *args, **options):
        owner = self._resolve_owner(options)
        today = timezone.localdate()

        if options["clear"]:
            deleted, _ = Pet.objects.filter(owner=owner).delete()
            self.stdout.write(f"Cleared {deleted} existing rows.")

        with transaction.atomic():
            milo = self._seed_milo(owner, today)
            luna = self._seed_luna(owner, today)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {milo.name} and {luna.name} for {owner.email or owner.username}."
            )
        )

    def _resolve_owner(self, options) -> User:
        email, username = options.get("email"), options.get("username")
        if not email and not username:
            raise CommandError("Pass --email or --username.")

        lookup = {"username": username} if username else {"email__iexact": email}
        try:
            return User.objects.get(**lookup)
        except User.DoesNotExist:
            raise CommandError(
                "No user matched. A Supabase account only becomes a Django user "
                "after its first authenticated request — sign in once, then "
                "re-run this."
            )
        except User.MultipleObjectsReturned:
            raise CommandError(
                "That email matches several users; pass --username instead."
            )

    def _seed_milo(self, owner: User, today) -> Pet:
        milo, created = Pet.objects.get_or_create(
            owner=owner,
            name="Milo",
            defaults={
                "species": "dog",
                "breed": "Golden Retriever",
                "photo_url": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=320&q=80",
                "birth_date": today - timedelta(days=365 * 3 + 40),
                "sex": "male",
                "neuter_status": "neutered",
                "ideal_weight_kg": Decimal("31.00"),
                "microchip_number": "985141004283921",
                "insurance_provider": "HealthyPaws",
                "insurance_policy": "90% reimbursement",
                "is_favourite": True,
                "clinic_name": "Oakwood Animal Hospital",
            },
        )
        if not created:
            return milo

        WeightEntry.objects.create(
            pet=milo,
            weight_kg=Decimal("31.20"),
            recorded_on=today - timedelta(days=32),
        )
        WeightEntry.objects.create(
            pet=milo, weight_kg=Decimal("31.40"), recorded_on=today - timedelta(days=2)
        )

        Vaccination.objects.create(
            pet=milo,
            name="Rabies (3-year)",
            administered_on=today - timedelta(days=400),
            due_on=today + timedelta(days=695),
            clinic="Oakwood Animal Hospital",
        )
        Vaccination.objects.create(
            pet=milo,
            name="DHPP core + booster",
            administered_on=today - timedelta(days=210),
            due_on=today + timedelta(days=520),
        )
        Vaccination.objects.create(
            pet=milo,
            name="Bordetella (kennel cough)",
            administered_on=today - timedelta(days=280),
            due_on=today + timedelta(days=88),
        )

        parasite = Medication.objects.create(
            pet=milo,
            name="Simparica Trio",
            detail="Flea, tick & heartworm chewable.",
            form="chew",
            cadence=Cadence.MONTHLY,
            next_due_on=today + timedelta(days=18),
        )
        joints = Medication.objects.create(
            pet=milo,
            name="Glucosamine joint soft chew",
            detail="1 chew with breakfast for hip support.",
            form="chew",
            cadence=Cadence.DAILY,
            next_due_on=today,
        )
        MedicationDose.objects.create(
            medication=joints,
            given_at=timezone.now() - timedelta(hours=3),
            note="Given with breakfast.",
        )
        MedicationDose.objects.create(
            medication=parasite, given_at=timezone.now() - timedelta(days=12)
        )

        Appointment.objects.create(
            pet=milo,
            title="Annual comprehensive wellness check",
            clinic="Oakwood Animal Hospital",
            vet_name="Dr. Emily Vance, DVM",
            vet_role="Primary veterinarian",
            starts_at=timezone.now() + timedelta(days=15),
            address="424 Elm Tree Road, Suite 2B",
        )

        CareEvent.record(
            milo,
            CareEventKind.VACCINATION,
            "Vaccination record verified by Oakwood Animal Hospital",
            "Rabies booster documentation synced from the clinic.",
        )
        CareEvent.record(
            milo,
            CareEventKind.WEIGHT,
            "Monthly weight check logged: 31.4 kg (+0.2 kg)",
            "Steady, ideal canine body score. The exercise routine is working.",
        )
        return milo

    def _seed_luna(self, owner: User, today) -> Pet:
        luna, created = Pet.objects.get_or_create(
            owner=owner,
            name="Luna",
            defaults={
                "species": "cat",
                "breed": "Domestic Shorthair",
                "photo_url": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=320&q=80",
                "birth_date": today - timedelta(days=365 * 2 + 15),
                "sex": "female",
                "neuter_status": "spayed",
                "ideal_weight_kg": Decimal("4.20"),
                "microchip_number": "985141009920114",
                "indoor_only": True,
                "clinic_name": "Oakwood Animal Hospital",
            },
        )
        if not created:
            return luna

        WeightEntry.objects.create(
            pet=luna, weight_kg=Decimal("4.20"), recorded_on=today - timedelta(days=6)
        )

        Vaccination.objects.create(
            pet=luna,
            name="FVRCP core booster",
            administered_on=today - timedelta(days=353),
            due_on=today + timedelta(days=12),
            clinic="Oakwood Animal Hospital",
        )
        Vaccination.objects.create(
            pet=luna,
            name="Rabies (1-year)",
            administered_on=today - timedelta(days=120),
            due_on=today + timedelta(days=245),
        )

        Medication.objects.create(
            pet=luna,
            name="Revolution Plus",
            detail="Topical parasite prevention.",
            form="topical",
            cadence=Cadence.MONTHLY,
            next_due_on=today + timedelta(days=7),
        )

        CareEvent.record(
            luna,
            CareEventKind.PET,
            "Luna joined the family",
            "Indoor-only profile created with her vaccination history.",
        )
        return luna
