import shutil
import tempfile
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from pet_profiles import presenters
from pet_profiles.models import (
    Appointment,
    CareEvent,
    CareEventKind,
    Cadence,
    Medication,
    MedicationDose,
    Pet,
    Vaccination,
    WeightEntry,
)

User = get_user_model()


def _make_user(username: str) -> User:
    return User.objects.create_user(username=username, email=f"{username}@test.dev")


class PetProfileTestCase(APITestCase):
    def setUp(self):
        self.owner = _make_user("owner")
        self.stranger = _make_user("stranger")
        self.client.force_authenticate(self.owner)
        self.pet = Pet.objects.create(
            owner=self.owner,
            name="Milo",
            species="dog",
            breed="Golden Retriever",
            birth_date=presenters.local_date(timezone.now())
            - timedelta(days=365 * 3 + 10),
            sex="male",
            neuter_status="neutered",
            ideal_weight_kg=Decimal("31.00"),
        )

    @property
    def today(self):
        return presenters.local_date(timezone.now())


class DashboardReadTests(PetProfileTestCase):
    def test_returns_only_the_requesting_owners_pets(self):
        Pet.objects.create(owner=self.stranger, name="NotYours", species="cat")

        response = self.client.get(reverse("fp-dashboard"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [pet["name"] for pet in response.data["pets"]]
        self.assertEqual(names, ["Milo"])
        self.assertIn(str(self.pet.id), response.data["wellness"])

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(reverse("fp-dashboard"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_household_returns_empty_collections(self):
        self.pet.delete()
        response = self.client.get(reverse("fp-dashboard"))

        self.assertEqual(response.data["pets"], [])
        self.assertEqual(response.data["wellness"], {})
        self.assertEqual(response.data["timeline"], [])

    def test_composes_the_view_model_the_client_renders(self):
        WeightEntry.objects.create(
            pet=self.pet, weight_kg=Decimal("31.40"), recorded_on=self.today
        )
        Vaccination.objects.create(
            pet=self.pet,
            name="FVRCP",
            due_on=self.today + timedelta(days=12),
            clinic="Marikina Pet Clinic",
        )

        response = self.client.get(reverse("fp-dashboard"))
        summary = response.data["pets"][0]
        wellness = response.data["wellness"][str(self.pet.id)]

        self.assertEqual(summary["ageLabel"], "3 yrs old · Male (Neutered)")
        self.assertEqual(summary["weightLabel"], "31.4 kg · Ideal weight")
        self.assertEqual(summary["weightValue"], "31.4 kg")
        self.assertEqual(summary["lastCheckupLabel"], "No visits logged")
        self.assertEqual(summary["tags"][0]["label"], "Vaccine due in 12 days")
        self.assertEqual(summary["tags"][0]["tone"], "secondary")

        self.assertEqual(wellness["vaccinations"]["status"]["label"], "Due soon")
        record = wellness["vaccinations"]["records"][0]
        self.assertEqual(record["validity"], "Due in 12 days")
        self.assertEqual(record["detail"], "Given at Marikina Pet Clinic")
        self.assertEqual(record["state"], "upcoming")

    def test_weight_trend_is_ordered_oldest_first_for_the_chart(self):
        for days, weight in ((60, "30.0"), (30, "30.8"), (0, "31.4")):
            WeightEntry.objects.create(
                pet=self.pet,
                weight_kg=Decimal(weight),
                recorded_on=self.today - timedelta(days=days),
            )

        response = self.client.get(reverse("fp-dashboard"))
        trend = response.data["wellness"][str(self.pet.id)]["vitals"]["trend"]

        self.assertEqual([point["value"] for point in trend["points"]], [30.0, 30.8, 31.4])
        self.assertEqual(trend["value"], "31.4")
        self.assertTrue(trend["rising"])
        self.assertEqual(
            trend["change"],
            f"+1.4 kg since {presenters._day_month(self.today - timedelta(days=60))}",
        )

    def test_a_single_weigh_in_is_a_reading_rather_than_a_trend(self):
        WeightEntry.objects.create(
            pet=self.pet, weight_kg=Decimal("31.40"), recorded_on=self.today
        )
        response = self.client.get(reverse("fp-dashboard"))
        trend = response.data["wellness"][str(self.pet.id)]["vitals"]["trend"]

        self.assertEqual(len(trend["points"]), 1)
        self.assertEqual(trend["change"], "First weight saved")

    def test_no_weigh_ins_means_no_curve_at_all(self):
        response = self.client.get(reverse("fp-dashboard"))
        vitals = response.data["wellness"][str(self.pet.id)]["vitals"]

        self.assertIsNone(vitals["trend"])

    def test_last_checkup_is_the_visit_that_happened_not_the_next_one(self):
        Appointment.objects.create(
            pet=self.pet,
            title="Annual wellness check",
            starts_at=timezone.now() - timedelta(days=40),
            status="completed",
        )
        Appointment.objects.create(
            pet=self.pet,
            title="Dental scale",
            starts_at=timezone.now() + timedelta(days=10),
            status="booked",
        )

        response = self.client.get(reverse("fp-dashboard"))
        seen = presenters.local_date(timezone.now() - timedelta(days=40))

        self.assertEqual(
            response.data["pets"][0]["lastCheckupLabel"],
            f"{presenters._day_month(seen)}, {seen.year}",
        )

    def test_a_shot_years_out_is_in_force_rather_than_a_standing_reminder(self):
        Vaccination.objects.create(
            pet=self.pet,
            name="Rabies (3-year)",
            administered_on=self.today - timedelta(days=30),
            due_on=self.today + timedelta(days=700),
        )
        response = self.client.get(reverse("fp-dashboard"))
        section = response.data["wellness"][str(self.pet.id)]["vaccinations"]

        self.assertEqual(section["records"][0]["state"], "active")
        self.assertEqual(section["status"]["label"], "Up to date")
        self.assertEqual(
            section["records"][0]["validity"],
            f"Good until {presenters._month_year(self.today + timedelta(days=700))}",
        )

    def test_medication_records_carry_the_id_the_client_posts_doses_to(self):
        medication = Medication.objects.create(
            pet=self.pet, name="Simparica Trio", cadence=Cadence.MONTHLY
        )
        response = self.client.get(reverse("fp-dashboard"))
        record = response.data["wellness"][str(self.pet.id)]["medications"][
            "records"
        ][0]

        self.assertEqual(record["id"], str(medication.id))

    def test_a_due_shot_and_healthy_and_thriving_are_never_both_claimed(self):
        Vaccination.objects.create(
            pet=self.pet, name="FVRCP", due_on=self.today + timedelta(days=12)
        )
        response = self.client.get(reverse("fp-dashboard"))
        labels = [tag["label"] for tag in response.data["pets"][0]["tags"]]

        self.assertIn("Vaccine due in 12 days", labels)
        self.assertNotIn("Healthy & thriving", labels)

    def test_a_settled_pet_does_get_the_reassuring_tag(self):
        Vaccination.objects.create(
            pet=self.pet, name="Rabies", due_on=self.today + timedelta(days=300)
        )
        response = self.client.get(reverse("fp-dashboard"))
        labels = [tag["label"] for tag in response.data["pets"][0]["tags"]]

        self.assertIn("Vaccines up to date", labels)
        self.assertIn("Healthy & thriving", labels)

    def test_absent_vitals_report_no_gauge_rather_than_a_made_up_one(self):
        response = self.client.get(reverse("fp-dashboard"))
        vitals = response.data["wellness"][str(self.pet.id)]["vitals"]

        self.assertIsNone(vitals["gauge"])
        self.assertEqual(vitals["metrics"], [])
        self.assertEqual(vitals["status"]["label"], "Nothing logged yet")

    def test_screening_is_null_because_scans_are_not_persisted(self):
        response = self.client.get(reverse("fp-dashboard"))
        self.assertIsNone(response.data["wellness"][str(self.pet.id)]["screening"])

    def test_overdue_vaccination_reads_as_overdue(self):
        Vaccination.objects.create(
            pet=self.pet, name="Rabies", due_on=self.today - timedelta(days=3)
        )
        response = self.client.get(reverse("fp-dashboard"))
        section = response.data["wellness"][str(self.pet.id)]["vaccinations"]

        self.assertEqual(section["status"]["label"], "Overdue")
        self.assertEqual(section["records"][0]["state"], "overdue")
        self.assertEqual(
            section["records"][0]["validity"],
            f"Overdue since {presenters._day_month(self.today - timedelta(days=3))}",
        )

    def test_appointment_carries_a_machine_readable_start(self):
        starts = timezone.now() + timedelta(days=5)
        Appointment.objects.create(
            pet=self.pet,
            title="Annual wellness check",
            clinic="Oakwood Animal Hospital",
            vet_name="Dr. Emily Vance",
            starts_at=starts,
            address="424 Elm Tree Road",
        )

        response = self.client.get(reverse("fp-dashboard"))
        appointment = response.data["wellness"][str(self.pet.id)]["appointment"]
        local = presenters._local(starts)

        self.assertEqual(appointment["startsAt"], local.strftime("%Y-%m-%dT%H:%M"))
        self.assertIn(str(local.day), appointment["when"])

    def test_past_appointments_are_not_offered_as_the_next_visit(self):
        Appointment.objects.create(
            pet=self.pet,
            title="Last year's check",
            starts_at=timezone.now() - timedelta(days=30),
        )
        response = self.client.get(reverse("fp-dashboard"))
        self.assertIsNone(response.data["wellness"][str(self.pet.id)]["appointment"])


class PetWriteTests(PetProfileTestCase):
    def test_creating_a_pet_scopes_it_and_starts_the_timeline(self):
        response = self.client.post(
            reverse("fp-pets"),
            {"name": "Luna", "species": "cat", "breed": "Domestic Shorthair"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        luna = Pet.objects.get(name="Luna")
        self.assertEqual(luna.owner, self.owner)
        self.assertTrue(
            CareEvent.objects.filter(pet=luna, kind=CareEventKind.PET).exists()
        )

    def test_a_nameless_pet_is_rejected(self):
        response = self.client.post(
            reverse("fp-pets"), {"name": "   ", "species": "dog"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_a_future_birth_date_is_rejected(self):
        response = self.client.post(
            reverse("fp-pets"),
            {
                "name": "Ghost",
                "species": "dog",
                "birth_date": (self.today + timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_one_owner_cannot_read_anothers_pet(self):
        theirs = Pet.objects.create(owner=self.stranger, name="Theirs", species="cat")
        response = self.client.get(
            reverse("fp-pet-detail", kwargs={"pk": theirs.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_one_owner_cannot_write_records_against_anothers_pet(self):
        theirs = Pet.objects.create(owner=self.stranger, name="Theirs", species="cat")
        response = self.client.post(
            reverse("fp-pet-weights", kwargs={"pet_id": theirs.pk}),
            {"weight_kg": "4.2"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(WeightEntry.objects.count(), 0)


class WeightTests(PetProfileTestCase):
    def test_logging_a_weight_records_it_and_the_drift_from_target(self):
        response = self.client.post(
            reverse("fp-pet-weights", kwargs={"pet_id": self.pet.pk}),
            {"weight_kg": "34.50"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        event = CareEvent.objects.get(kind=CareEventKind.WEIGHT)
        self.assertIn("34.50 kg", event.title)
        self.assertIn("over", event.detail)

    def test_an_implausible_weight_is_rejected(self):
        response = self.client.post(
            reverse("fp-pet-weights", kwargs={"pet_id": self.pet.pk}),
            {"weight_kg": "3140"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_future_weigh_in_is_rejected(self):
        response = self.client.post(
            reverse("fp-pet-weights", kwargs={"pet_id": self.pet.pk}),
            {
                "weight_kg": "31.0",
                "recorded_on": (self.today + timedelta(days=2)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_the_vitals_card_reports_the_change_between_weigh_ins(self):
        WeightEntry.objects.create(
            pet=self.pet,
            weight_kg=Decimal("31.00"),
            recorded_on=self.today - timedelta(days=30),
        )
        WeightEntry.objects.create(
            pet=self.pet, weight_kg=Decimal("31.40"), recorded_on=self.today
        )

        response = self.client.get(reverse("fp-dashboard"))
        metrics = response.data["wellness"][str(self.pet.id)]["vitals"]["metrics"]

        self.assertEqual(metrics[0]["value"], "31.4")
        self.assertEqual(metrics[1]["label"], "Change")
        self.assertEqual(metrics[1]["value"], "+0.4")

    def test_a_weight_far_from_target_flags_the_card_for_watching(self):
        WeightEntry.objects.create(
            pet=self.pet, weight_kg=Decimal("40.00"), recorded_on=self.today
        )
        response = self.client.get(reverse("fp-dashboard"))
        vitals = response.data["wellness"][str(self.pet.id)]["vitals"]

        self.assertEqual(vitals["status"]["label"], "Keep an eye on it")
        self.assertEqual(vitals["status"]["tone"], "tertiary")


class MedicationDoseTests(PetProfileTestCase):
    def setUp(self):
        super().setUp()
        self.medication = Medication.objects.create(
            pet=self.pet,
            name="Simparica Trio",
            detail="Flea, tick & heartworm chewable.",
            form="chew",
            cadence=Cadence.MONTHLY,
            next_due_on=self.today,
        )

    def test_logging_a_dose_advances_the_schedule(self):
        response = self.client.post(
            reverse("fp-medication-doses", kwargs={"medication_id": self.medication.pk}),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.medication.refresh_from_db()
        self.assertEqual(self.medication.next_due_on, self.today + timedelta(days=30))
        self.assertEqual(MedicationDose.objects.count(), 1)

    def test_a_dose_logged_today_reads_as_given_rather_than_due(self):
        self.client.post(
            reverse("fp-medication-doses", kwargs={"medication_id": self.medication.pk}),
            {},
            format="json",
        )

        response = self.client.get(reverse("fp-dashboard"))
        record = response.data["wellness"][str(self.pet.id)]["medications"]["records"][0]

        self.assertTrue(record["note"].startswith("Given today at"))
        self.assertEqual(record["noteTone"], "primary")

        self.assertEqual(
            record["nextDue"],
            f"Next dose {presenters._day_month(self.today + timedelta(days=30))} "
            f"({presenters._relative_days(self.today + timedelta(days=30))})",
        )

    def test_an_as_needed_regimen_has_no_next_dose_to_name(self):
        self.medication.cadence = Cadence.AS_NEEDED
        self.medication.next_due_on = None
        self.medication.save()

        response = self.client.get(reverse("fp-dashboard"))
        record = response.data["wellness"][str(self.pet.id)]["medications"]["records"][0]

        self.assertIsNone(record["nextDue"])

    def test_an_as_needed_regimen_has_no_schedule_to_advance(self):
        self.medication.cadence = Cadence.AS_NEEDED
        self.medication.next_due_on = None
        self.medication.save()

        self.client.post(
            reverse("fp-medication-doses", kwargs={"medication_id": self.medication.pk}),
            {},
            format="json",
        )

        self.medication.refresh_from_db()
        self.assertIsNone(self.medication.next_due_on)

    def test_a_dose_in_the_future_is_rejected(self):
        response = self.client.post(
            reverse("fp-medication-doses", kwargs={"medication_id": self.medication.pk}),
            {"given_at": (timezone.now() + timedelta(hours=2)).isoformat()},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_stranger_cannot_log_a_dose_on_this_medication(self):
        self.client.force_authenticate(self.stranger)
        response = self.client.post(
            reverse("fp-medication-doses", kwargs={"medication_id": self.medication.pk}),
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(MedicationDose.objects.count(), 0)


_UPLOAD_DIR = tempfile.mkdtemp(prefix="pawmed-test-media-")


@override_settings(MEDIA_ROOT=_UPLOAD_DIR)
class DocumentTests(PetProfileTestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(_UPLOAD_DIR, ignore_errors=True)
        super().tearDownClass()

    def test_uploading_a_document_appears_in_the_passport_card(self):
        upload = SimpleUploadedFile(
            "bloods.pdf", b"%PDF-1.4 fake", content_type="application/pdf"
        )
        response = self.client.post(
            reverse("fp-pet-documents", kwargs={"pet_id": self.pet.pk}),
            {"label": "Annual blood panel", "kind": "lab", "file": upload},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        dashboard = self.client.get(reverse("fp-dashboard"))
        labels = [
            record["label"]
            for record in dashboard.data["wellness"][str(self.pet.id)]["passport"][
                "records"
            ]
        ]
        self.assertIn("Annual blood panel", labels)

    def test_an_unlabelled_document_is_rejected(self):
        upload = SimpleUploadedFile("x.pdf", b"data", content_type="application/pdf")
        response = self.client.post(
            reverse("fp-pet-documents", kwargs={"pet_id": self.pet.pk}),
            {"label": "  ", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TimelineTests(PetProfileTestCase):
    def test_the_timeline_spans_the_household_and_is_newest_first(self):
        luna = Pet.objects.create(owner=self.owner, name="Luna", species="cat")
        CareEvent.objects.create(
            pet=self.pet,
            kind=CareEventKind.WEIGHT,
            title="Older",
            occurred_at=timezone.now() - timedelta(days=2),
        )
        CareEvent.objects.create(
            pet=luna, kind=CareEventKind.DOSE, title="Newer"
        )

        response = self.client.get(reverse("fp-dashboard"))
        titles = [event["title"] for event in response.data["timeline"]]

        self.assertEqual(titles, ["Newer", "Older"])

    def test_another_households_events_never_appear(self):
        theirs = Pet.objects.create(owner=self.stranger, name="Theirs", species="cat")
        CareEvent.objects.create(pet=theirs, kind=CareEventKind.DOSE, title="Secret")

        response = self.client.get(reverse("fp-dashboard"))
        self.assertEqual(response.data["timeline"], [])

    def test_events_carry_the_icon_and_tone_the_client_expects(self):
        CareEvent.objects.create(
            pet=self.pet, kind=CareEventKind.VACCINATION, title="Rabies recorded"
        )
        response = self.client.get(reverse("fp-dashboard"))
        event = response.data["timeline"][0]

        self.assertEqual(event["icon"], "syringe")
        self.assertEqual(event["tone"], "primary")
        self.assertTrue(event["timeLabel"].startswith("Today, "))


class PresenterTests(PetProfileTestCase):
    def test_relative_days_reads_naturally_around_today(self):
        self.assertEqual(presenters._relative_days(self.today), "today")
        self.assertEqual(
            presenters._relative_days(self.today + timedelta(days=1)), "tomorrow"
        )
        self.assertEqual(
            presenters._relative_days(self.today + timedelta(days=12)), "in 12 days"
        )
        self.assertEqual(
            presenters._relative_days(self.today + timedelta(days=90)), "in 3 months"
        )
        self.assertEqual(
            presenters._relative_days(self.today - timedelta(days=1)), "yesterday"
        )

    def test_weights_lose_their_trailing_zeros(self):
        self.assertEqual(presenters._trim(Decimal("31.40")), "31.4")
        self.assertEqual(presenters._trim(Decimal("4.00")), "4")
        self.assertEqual(presenters._trim(Decimal("0.50")), "0.5")

    def test_an_unknown_birth_date_says_so_instead_of_guessing_zero(self):
        self.pet.birth_date = None
        self.pet.save()
        self.assertIn("Age not set", presenters._age_label(self.pet))

    def test_a_vaccination_with_no_dates_is_neither_due_nor_overdue(self):
        vaccination = Vaccination.objects.create(
            pet=self.pet, name="Kennel cough", administered_on=self.today
        )
        self.assertEqual(presenters._vaccination_state(vaccination), "active")

    def test_a_pet_under_two_is_described_in_months(self):
        self.pet.birth_date = self.today - timedelta(days=200)
        self.pet.save()
        self.assertIn("mo old", presenters._age_label(self.pet))
