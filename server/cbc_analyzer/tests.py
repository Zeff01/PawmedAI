import io
from datetime import date
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from rest_framework.test import APIClient

from cbc_analyzer.management.commands.seed_medical_log import build_plan
from cbc_analyzer.models import MedicalLog, Pet
from cbc_analyzer.reference import evaluate_panel
from users.models import UserProfile

User = get_user_model()


class ReferenceFlaggingTests(TestCase):
    """The flags are pure Python, so they are pinned by exact assertions."""

    def test_species_changes_the_interval_applied(self):
        # 10.5 g/dL is anaemic for a dog and mid-range for a cat.
        canine = evaluate_panel({"hgb": 10.5}, "canine")
        feline = evaluate_panel({"hgb": 10.5}, "feline")

        self.assertEqual(canine["results"][0]["status"], "low")
        self.assertEqual(canine["result_status"], "low")
        self.assertEqual(feline["results"][0]["status"], "normal")
        self.assertEqual(feline["result_status"], "normal")

    def test_species_aliases_resolve_to_a_table(self):
        self.assertEqual(evaluate_panel({"hgb": 14.0}, "dog")["species"], "canine")
        self.assertEqual(evaluate_panel({"hgb": 14.0}, "Cat")["species"], "feline")
        self.assertEqual(evaluate_panel({"hgb": 14.0}, "rabbit")["species"], "rabbit")
        self.assertEqual(evaluate_panel({"hgb": 14.0}, "horse")["species"], "equine")
        self.assertEqual(
            evaluate_panel({"hgb": 14.0}, "guinea pig")["species"], "guinea_pig"
        )
        self.assertEqual(evaluate_panel({"hgb": 14.0}, "gecko")["species"], "other")

    def test_one_sided_intervals_only_flag_upwards(self):
        result = evaluate_panel({"neut_band_abs": 0.0, "baso_abs": 0.9}, "canine")
        by_key = {entry["key"]: entry for entry in result["results"]}

        self.assertEqual(by_key["neut_band_abs"]["status"], "normal")
        self.assertEqual(by_key["neut_band_abs"]["reference_label"], "<0.30 10^9/L")
        self.assertEqual(by_key["baso_abs"]["status"], "high")

    def test_mixed_flags_report_as_abnormal(self):
        self.assertEqual(
            evaluate_panel({"hgb": 10.5, "wbc": 25.0}, "canine")["result_status"],
            "abnormal",
        )
        self.assertEqual(
            evaluate_panel({"wbc": 25.0}, "canine")["result_status"], "high"
        )
        self.assertEqual(
            evaluate_panel({"hgb": 14.0}, "canine")["result_status"], "normal"
        )

    def test_omitted_analytes_are_absent_rather_than_zero(self):
        result = evaluate_panel({"hgb": 14.0, "wbc": None}, "canine")

        self.assertEqual([entry["key"] for entry in result["results"]], ["hgb"])
        self.assertIn("wbc", result["missing_required"])

    def test_results_follow_panel_order(self):
        result = evaluate_panel({"plt": 350, "hgb": 14.0, "wbc": 9.0}, "canine")
        self.assertEqual(
            [entry["key"] for entry in result["results"]], ["hgb", "wbc", "plt"]
        )


class ProfessionalOnlyAccessTests(TestCase):
    """Every endpoint in the app is gated on the professional profile type."""

    ENDPOINTS = (
        "/api/cbc/logs/",
        "/api/cbc/logs/summary/",
        "/api/cbc/pets/",
    )

    def setUp(self):
        self.client = APIClient()

    def _user(self, username, user_type):
        user = User.objects.create(username=username)
        UserProfile.objects.create(user=user, user_type=user_type)
        return user

    def test_anonymous_is_rejected(self):
        for endpoint in self.ENDPOINTS:
            with self.subTest(endpoint=endpoint):
                self.assertIn(
                    self.client.get(endpoint).status_code, (401, 403)
                )

    def test_non_professional_profiles_are_rejected(self):
        for user_type in ("student", "fur_parent", None):
            user = self._user(f"user-{user_type}", user_type)
            self.client.force_authenticate(user=user)
            for endpoint in self.ENDPOINTS:
                with self.subTest(user_type=user_type, endpoint=endpoint):
                    self.assertEqual(self.client.get(endpoint).status_code, 403)

    def test_professional_is_allowed(self):
        self.client.force_authenticate(user=self._user("vet", "professional"))
        for endpoint in self.ENDPOINTS:
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(endpoint).status_code, 200)


class MedicalLogWriteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vet = User.objects.create(username="vet", first_name="Arlo")
        UserProfile.objects.create(user=self.vet, user_type="professional")
        self.client.force_authenticate(user=self.vet)

        self.other_vet = User.objects.create(username="other-vet")
        UserProfile.objects.create(user=self.other_vet, user_type="professional")

    def _payload(self, **overrides):
        payload = {
            "species": "canine",
            "pet_name": "Buddy",
            "values": {"hgb": 10.5, "wbc": 9.0},
            "key_findings": "Mild anaemia",
            "diagnostic_brief": "Mild non-regenerative anaemia.",
        }
        payload.update(overrides)
        return payload

    def test_flags_are_recomputed_on_save(self):
        # A client claiming everything is normal must not be believed.
        response = self.client.post(
            "/api/cbc/logs/",
            self._payload(result_status="normal", flag_count=0),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        log = MedicalLog.objects.get(record_id=response.data["record_id"])
        self.assertEqual(log.result_status, "low")
        self.assertEqual(log.flag_count, 1)
        self.assertEqual(log.evaluation["flags"][0]["key"], "hgb")

    def test_record_ids_are_sequential_per_day(self):
        first = self.client.post("/api/cbc/logs/", self._payload(), format="json")
        second = self.client.post("/api/cbc/logs/", self._payload(), format="json")

        self.assertTrue(first.data["record_id"].startswith("RCBC-"))
        self.assertTrue(first.data["record_id"].endswith("-001"))
        self.assertTrue(second.data["record_id"].endswith("-002"))

    def test_linking_a_pet_snapshots_its_profile(self):
        pet = Pet.objects.create(
            user=self.vet,
            name="Luna",
            species="feline",
            breed="Persian",
            owner_name="A. Cruz",
        )
        response = self.client.post(
            "/api/cbc/logs/", self._payload(pet=pet.id), format="json"
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["pet_name"], "Luna")
        self.assertEqual(response.data["breed"], "Persian")
        self.assertEqual(response.data["owner_name"], "A. Cruz")
        # Feline intervals now apply, so the same haemoglobin reads as normal.
        self.assertEqual(response.data["result_status"], "normal")

    def test_another_vets_pet_cannot_be_linked(self):
        foreign = Pet.objects.create(
            user=self.other_vet, name="Max", species="canine"
        )
        response = self.client.post(
            "/api/cbc/logs/", self._payload(pet=foreign.id), format="json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("pet", response.data)

    def test_unknown_and_negative_values_are_rejected(self):
        bad_key = self.client.post(
            "/api/cbc/logs/",
            self._payload(values={"cholesterol": 4.2}),
            format="json",
        )
        negative = self.client.post(
            "/api/cbc/logs/", self._payload(values={"hgb": -1}), format="json"
        )

        self.assertEqual(bad_key.status_code, 400)
        self.assertEqual(negative.status_code, 400)

    def test_records_are_scoped_to_their_owner(self):
        MedicalLog.objects.create(
            user=self.other_vet, species="canine", pet_name="Max", values={"hgb": 14}
        )
        self.client.post("/api/cbc/logs/", self._payload(), format="json")

        listed = self.client.get("/api/cbc/logs/")
        self.assertEqual(listed.data["count"], 1)
        self.assertEqual(listed.data["results"][0]["pet_name"], "Buddy")

    def test_only_notes_are_amendable(self):
        created = self.client.post("/api/cbc/logs/", self._payload(), format="json")
        record_id = created.data["record_id"]

        amended = self.client.patch(
            f"/api/cbc/logs/{record_id}/",
            {"clinical_notes": "Recheck in 14 days.", "values": {"hgb": 18.0}},
            format="json",
        )

        self.assertEqual(amended.status_code, 200)
        self.assertEqual(amended.data["clinical_notes"], "Recheck in 14 days.")
        self.assertEqual(amended.data["values"], {"hgb": 10.5, "wbc": 9.0})

    def test_summary_counts_normal_against_abnormal(self):
        self.client.post("/api/cbc/logs/", self._payload(), format="json")
        self.client.post(
            "/api/cbc/logs/",
            self._payload(values={"hgb": 14.0, "wbc": 9.0}),
            format="json",
        )

        summary = self.client.get("/api/cbc/logs/summary/")
        self.assertEqual(summary.data["total"], 2)
        self.assertEqual(summary.data["normal"], 1)
        self.assertEqual(summary.data["abnormal"], 1)
        self.assertEqual(summary.data["this_month"], 2)
        # No window requested, so there is no previous period to compare with.
        self.assertIsNone(summary.data["normal_change"])


def _png_bytes() -> bytes:
    """A 1x1 PNG, enough to satisfy ImageField validation."""
    from PIL import Image

    buffer = io.BytesIO()
    Image.new("RGB", (1, 1), (255, 255, 255)).save(buffer, format="PNG")
    return buffer.getvalue()


class AnalyzeEndpointTests(TestCase):
    """
    End-to-end coverage of the analyze view with the model calls mocked.

    The point of these is the wiring around Gemini: whose numbers win, what
    happens when the image is not a report, and whether the flags survive a
    failed narrative.
    """

    def setUp(self):
        self.client = APIClient()
        self.vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=self.vet, user_type="professional")
        self.client.force_authenticate(user=self.vet)

        self.narrative = {
            "key_findings": "Mild anaemia",
            "diagnostic_brief": "Mild non-regenerative anaemia is present.",
            "clinical_notes": "Recommendation: repeat in 14 days.",
        }

    def _image(self):
        return SimpleUploadedFile("report.png", _png_bytes(), content_type="image/png")

    def _extraction(self, values, **overrides):
        payload = {
            "values": values,
            "patient": {},
            "sample_quality": [],
            "smear_morphology": "",
            "is_cbc_report": True,
            "unreadable_reason": "",
        }
        payload.update(overrides)
        return payload

    def test_typed_panel_is_flagged_and_narrated(self):
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.interpret.return_value = self.narrative
            response = self.client.post(
                "/api/cbc/analyze/",
                {
                    "species": "canine",
                    "pet_name": "Buddy",
                    "values": {"hgb": 10.5, "wbc": 9.0},
                },
                format="json",
            )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["result_status"], "low")
        self.assertEqual(response.data["flag_count"], 1)
        self.assertEqual(response.data["diagnostic_brief"], self.narrative["diagnostic_brief"])
        self.assertFalse(response.data["read_from_image"])
        # No image, so the transcription step must never be reached.
        analyzer_class.return_value.extract_panel.assert_not_called()

    def test_typed_values_override_the_transcribed_report(self):
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.extract_panel.return_value = self._extraction(
                {"hgb": 9.0, "wbc": 22.0}
            )
            analyzer_class.return_value.interpret.return_value = self.narrative
            response = self.client.post(
                "/api/cbc/analyze/",
                {
                    "species": "canine",
                    "image": self._image(),
                    # The clinician corrected the haemoglobin by hand.
                    "values": '{"hgb": 14.0}',
                },
                format="multipart",
            )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["values"]["hgb"], 14.0)
        self.assertEqual(response.data["values"]["wbc"], 22.0)
        self.assertTrue(response.data["read_from_image"])
        self.assertEqual(
            sorted(response.data["extracted_values"]), ["hgb", "wbc"]
        )
        # Only the uncorrected WBC should be flagged.
        self.assertEqual(
            [flag["key"] for flag in response.data["flags"]], ["wbc"]
        )

    def test_non_report_image_with_no_typed_values_is_rejected(self):
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.extract_panel.return_value = self._extraction(
                {}, is_cbc_report=False, unreadable_reason="This is a photo of a dog."
            )
            response = self.client.post(
                "/api/cbc/analyze/",
                {"species": "canine", "image": self._image()},
                format="multipart",
            )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data["code"], "not_a_cbc_report")
        self.assertIn("photo of a dog", response.data["detail"])

    def test_non_report_image_falls_back_to_typed_values_with_a_notice(self):
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.extract_panel.return_value = self._extraction(
                {}, is_cbc_report=False, unreadable_reason="Not a lab report."
            )
            analyzer_class.return_value.interpret.return_value = self.narrative
            response = self.client.post(
                "/api/cbc/analyze/",
                {
                    "species": "canine",
                    "image": self._image(),
                    "values": '{"hgb": 10.5}',
                },
                format="multipart",
            )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("Not a lab report.", response.data["notice"])
        self.assertEqual(response.data["result_status"], "low")
        self.assertFalse(response.data["read_from_image"])

    def test_a_failed_narrative_still_returns_the_flags(self):
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.interpret.side_effect = RuntimeError("boom")
            response = self.client.post(
                "/api/cbc/analyze/",
                {"species": "canine", "values": {"hgb": 10.5}},
                format="json",
            )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["result_status"], "low")
        self.assertEqual(response.data["diagnostic_brief"], "")
        self.assertIn("HGB low", response.data["key_findings"])
        self.assertIn("could not be generated", response.data["notice"])

    def test_an_undecidable_species_is_asked_for(self):
        # Haemoglobin overlaps between dogs and cats, so nothing can decide.
        response = self.client.post(
            "/api/cbc/analyze/", {"values": {"hgb": 10.5}}, format="json"
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data["code"], "species_required")

    def test_an_empty_submission_is_rejected(self):
        response = self.client.post(
            "/api/cbc/analyze/", {"species": "canine"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_non_professionals_cannot_analyse(self):
        student = User.objects.create(username="student")
        UserProfile.objects.create(user=student, user_type="student")
        self.client.force_authenticate(user=student)

        response = self.client.post(
            "/api/cbc/analyze/",
            {"species": "canine", "values": {"hgb": 10.5}},
            format="json",
        )
        self.assertEqual(response.status_code, 403)


class PetRosterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=self.vet, user_type="professional")
        self.client.force_authenticate(user=self.vet)

    def test_creating_a_pet_scopes_it_to_the_clinician(self):
        response = self.client.post(
            "/api/cbc/pets/",
            {"name": "  Buddy  ", "species": "canine", "owner_name": "M. Reyes"},
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["name"], "Buddy")
        self.assertEqual(Pet.objects.get().user, self.vet)

    def test_other_species_needs_a_label(self):
        response = self.client.post(
            "/api/cbc/pets/", {"name": "Thumper", "species": "other"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("species_label", response.data)

    def test_another_vets_roster_is_invisible(self):
        other = User.objects.create(username="other")
        UserProfile.objects.create(user=other, user_type="professional")
        Pet.objects.create(user=other, name="Max", species="canine")
        Pet.objects.create(user=self.vet, name="Luna", species="feline")

        response = self.client.get("/api/cbc/pets/")
        self.assertEqual([pet["name"] for pet in response.data], ["Luna"])


class ExtractedPatientMergeTests(TestCase):
    """Report-read patient context fills gaps but never overrides the clinician."""

    def setUp(self):
        self.client = APIClient()
        vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=vet, user_type="professional")
        self.client.force_authenticate(user=vet)

    def _post(self, extracted_patient, **fields):
        payload = {
            "species": "canine",
            "image": SimpleUploadedFile(
                "report.png", _png_bytes(), content_type="image/png"
            ),
            "values": '{"hgb": 14.0}',
        }
        payload.update(fields)
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.extract_panel.return_value = {
                "values": {"wbc": 9.0},
                "patient": extracted_patient,
                "sample_quality": ["clotted"],
                "smear_morphology": "Platelet clumping noted.",
                "is_cbc_report": True,
                "unreadable_reason": "",
            }
            analyzer_class.return_value.interpret.return_value = {
                "key_findings": "Normal panel",
                "diagnostic_brief": "Unremarkable.",
                "clinical_notes": "",
            }
            return self.client.post(
                "/api/cbc/analyze/", payload, format="multipart"
            )

    def test_blank_fields_are_filled_from_the_report(self):
        response = self._post(
            {
                "pet_name": "Buddy",
                "owner_name": "M. Reyes",
                "breed": "Golden Retriever",
                "age_years": 6.0,
                "sex": "male",
                "neuter_status": "neutered",
            }
        )

        self.assertEqual(response.status_code, 200, response.data)
        patient = response.data["patient"]
        self.assertEqual(patient["pet_name"], "Buddy")
        self.assertEqual(patient["owner_name"], "M. Reyes")
        self.assertEqual(patient["breed"], "Golden Retriever")
        self.assertEqual(patient["age_years"], 6.0)
        self.assertEqual(patient["sex"], "male")
        self.assertEqual(patient["neuter_status"], "neutered")
        # Supporting context is adopted on the same "only if blank" rule.
        self.assertEqual(response.data["sample_quality"], ["clotted"])
        self.assertIn("Platelet clumping", response.data["smear_morphology"])

    def test_typed_fields_win_over_the_report(self):
        response = self._post(
            {
                "pet_name": "Buddy",
                "breed": "Golden Retriever",
                "age_years": 6.0,
                "sex": "male",
            },
            pet_name="Luna",
            breed="Labrador",
            age_years="3",
            sex="female",
            sample_quality='["hemolyzed"]',
            smear_morphology="No abnormalities seen.",
        )

        self.assertEqual(response.status_code, 200, response.data)
        patient = response.data["patient"]
        self.assertEqual(patient["pet_name"], "Luna")
        self.assertEqual(patient["breed"], "Labrador")
        self.assertEqual(patient["age_years"], 3.0)
        self.assertEqual(patient["sex"], "female")
        self.assertEqual(response.data["sample_quality"], ["hemolyzed"])
        self.assertEqual(
            response.data["smear_morphology"], "No abnormalities seen."
        )

    def test_species_is_never_taken_from_the_report(self):
        # The report says cat; the clinician selected dog. Species chooses the
        # reference table, so the clinician's choice must stand.
        response = self._post({"species": "feline", "breed": "Persian"})

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["patient"]["species"], "canine")
        self.assertEqual(response.data["patient"]["species_display"], "Canine")


class RecordIdCollisionTests(TestCase):
    def setUp(self):
        self.vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=self.vet, user_type="professional")

    def test_a_colliding_record_id_is_retried(self):
        first = MedicalLog.objects.create(
            user=self.vet, species="canine", values={"hgb": 14}
        )

        # Force the generator to hand back an id that is already taken once,
        # standing in for two concurrent saves racing on the same counter.
        real_generate = MedicalLog._generate_record_id
        calls = {"n": 0}

        def flaky(self):
            calls["n"] += 1
            if calls["n"] == 1:
                return first.record_id
            return real_generate(self)

        with mock.patch.object(MedicalLog, "_generate_record_id", flaky):
            second = MedicalLog.objects.create(
                user=self.vet, species="canine", values={"hgb": 14}
            )

        self.assertEqual(calls["n"], 2)
        self.assertNotEqual(second.record_id, first.record_id)
        self.assertTrue(second.record_id.endswith("-002"))
        self.assertEqual(MedicalLog.objects.count(), 2)


class ReportPrefillTests(TestCase):
    """
    The patient's identity is collected at save/download time, so the analyze
    response has to say what the report already supplied and warn when the
    report disagrees with the selected species.
    """

    def setUp(self):
        self.client = APIClient()
        vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=vet, user_type="professional")
        self.client.force_authenticate(user=vet)

    def _post(self, extracted_patient, species="canine", **fields):
        payload = {
            "species": species,
            "image": SimpleUploadedFile(
                "report.png", _png_bytes(), content_type="image/png"
            ),
        }
        payload.update(fields)
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.extract_panel.return_value = {
                "values": {"hgb": 14.0},
                "patient": extracted_patient,
                "sample_quality": [],
                "smear_morphology": "",
                "is_cbc_report": True,
                "unreadable_reason": "",
            }
            analyzer_class.return_value.interpret.return_value = {
                "key_findings": "Normal panel",
                "diagnostic_brief": "Unremarkable.",
                "clinical_notes": "",
            }
            return self.client.post(
                "/api/cbc/analyze/", payload, format="multipart"
            )

    def test_report_read_fields_are_named_in_the_response(self):
        response = self._post(
            {
                "pet_name": "Buddy",
                "owner_name": "M. Reyes",
                "breed": "Golden Retriever",
                "age_years": 6.0,
                "sex": "male",
            }
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            response.data["extracted_patient_fields"],
            ["age_years", "breed", "owner_name", "pet_name", "sex"],
        )
        self.assertEqual(response.data["patient"]["pet_name"], "Buddy")

    def test_a_report_with_no_patient_details_reports_nothing_prefilled(self):
        # The common case the clinician described: a printout with values only.
        response = self._post({})

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["extracted_patient_fields"], [])
        self.assertEqual(response.data["patient"]["pet_name"], "")

    def test_a_typed_field_is_not_reported_as_prefilled(self):
        response = self._post({"pet_name": "Buddy"}, pet_name="Luna")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["extracted_patient_fields"], [])
        self.assertEqual(response.data["patient"]["pet_name"], "Luna")

    def test_a_species_mismatch_is_warned_about_not_corrected(self):
        response = self._post({"species": "feline"}, species="canine")

        self.assertEqual(response.status_code, 200, response.data)
        # The clinician's choice stands, so the flags stay reproducible…
        self.assertEqual(response.data["patient"]["species"], "canine")
        # …but the disagreement is surfaced.
        self.assertIn("feline panel", response.data["notice"])
        self.assertIn("Canine reference intervals", response.data["notice"])

    def test_an_unrecognised_species_is_not_a_mismatch(self):
        # "other" from the report means "not recognisably a dog or a cat" — the
        # absence of a claim. Treating it as a contradiction fired this notice on
        # almost every upload and told the clinician nothing.
        response = self._post({"species": "other"}, species="canine")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["patient"]["species"], "canine")
        self.assertEqual(response.data["notice"], "")

    def test_a_silent_report_is_not_a_mismatch(self):
        response = self._post({"species": ""}, species="canine")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["notice"], "")

    def test_an_exotic_choice_still_names_itself_in_the_warning(self):
        response = self._post(
            {"species": "canine"}, species="other", species_label="Rabbit"
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("canine panel", response.data["notice"])
        # The chosen species is named by its label, not the word "other".
        self.assertIn("Rabbit reference intervals", response.data["notice"])

    def test_a_matching_species_produces_no_warning(self):
        response = self._post({"species": "canine"}, species="canine")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["notice"], "")

    def test_a_report_stated_species_is_used_without_asking(self):
        response = self._post({"species": "feline"}, species="")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["patient"]["species"], "feline")
        self.assertEqual(response.data["species_source"], "report")
        # Nothing to warn about — the species came from the report itself.
        self.assertEqual(response.data["notice"], "")


class SpeciesResolutionTests(TestCase):
    """
    The analyzer asks for species only as a last resort: what the clinician
    chose, then what the report printed. There is no third tier — inferring the
    species from MCV/MCH worked while the table held only dogs and cats, but an
    MCV of 45 fL fits feline, equine, and bovine alike.
    """

    def setUp(self):
        self.client = APIClient()
        vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=vet, user_type="professional")
        self.client.force_authenticate(user=vet)
        self.narrative = {
            "key_findings": "Normal panel",
            "diagnostic_brief": "Unremarkable.",
            "clinical_notes": "",
        }

    def _typed(self, values, **fields):
        payload = {"values": values}
        payload.update(fields)
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.interpret.return_value = self.narrative
            return self.client.post(
                "/api/cbc/analyze/", payload, format="json"
            )

    # ── Precedence ─────────────────────────────────────────────────────────

    def test_an_explicit_choice_is_used_verbatim(self):
        response = self._typed({"mcv": 41.8, "hgb": 10.7}, species="canine")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["patient"]["species"], "canine")
        self.assertEqual(response.data["species_source"], "selected")
        self.assertEqual(response.data["result_status"], "low")

    def test_a_typed_panel_with_no_species_asks(self):
        # Nothing can decide without an image or a choice, whatever the indices.
        response = self._typed({"mcv": 41.8, "mch": 14.8, "hgb": 10.7})

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data["code"], "species_required")

    def test_the_report_supplies_the_species_when_nothing_was_chosen(self):
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.extract_panel.return_value = {
                "values": {"mcv": 68.0, "hgb": 10.7},
                "patient": {"species": "feline"},
                "sample_quality": [],
                "smear_morphology": "",
                "is_cbc_report": True,
                "unreadable_reason": "",
            }
            analyzer_class.return_value.interpret.return_value = self.narrative
            response = self.client.post(
                "/api/cbc/analyze/",
                {
                    "image": SimpleUploadedFile(
                        "report.png", _png_bytes(), content_type="image/png"
                    )
                },
                format="multipart",
            )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["patient"]["species"], "feline")
        self.assertEqual(response.data["species_source"], "report")

    def test_other_species_still_needs_a_label_when_chosen(self):
        response = self._typed({"mcv": 41.8}, species="other")

        self.assertEqual(response.status_code, 400)
        self.assertIn("species_label", response.data)


class HumanReportTests(TestCase):
    """
    A human CBC is the most likely reason species inference abstains: human
    indices sit outside both the canine and feline ranges. Asking "dog or cat?"
    about a human report is the wrong question, so it is named explicitly.
    """

    #: The panel from a real human report: MCV 80 fL and MCH 30 pg are above
    #: both the canine (60-77 / 19.5-24.5) and feline (39-55 / 13-17) ranges.
    HUMAN_VALUES = {"hgb": 15.0, "mcv": 80.0, "mch": 30.0, "mchc": 37.5}

    def setUp(self):
        self.client = APIClient()
        vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=vet, user_type="professional")
        self.client.force_authenticate(user=vet)
        self.narrative = {
            "key_findings": "Reviewed",
            "diagnostic_brief": "Reviewed.",
            "clinical_notes": "",
        }

    def _post(self, *, is_human, **fields):
        payload = {
            "image": SimpleUploadedFile(
                "report.png", _png_bytes(), content_type="image/png"
            )
        }
        payload.update(fields)
        with mock.patch(
            "cbc_analyzer.views.CBCAnalyzer", autospec=True
        ) as analyzer_class:
            analyzer_class.return_value.extract_panel.return_value = {
                "values": self.HUMAN_VALUES,
                "patient": {},
                "sample_quality": [],
                "smear_morphology": "",
                "is_cbc_report": True,
                "is_human_report": is_human,
                "unreadable_reason": "",
            }
            analyzer_class.return_value.interpret.return_value = self.narrative
            return self.client.post(
                "/api/cbc/analyze/", payload, format="multipart"
            )

    def test_a_human_report_is_named_rather_than_guessed_at(self):
        response = self._post(is_human=True)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data["code"], "species_required")
        self.assertTrue(response.data["looks_human"])
        self.assertIn("human CBC report", response.data["detail"])

    def test_an_unlabelled_animal_report_gets_the_generic_prompt(self):
        # Same undecidable indices, but nothing says it is human.
        response = self._post(is_human=False)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data["code"], "species_required")
        self.assertFalse(response.data["looks_human"])
        self.assertIn("does not say which species", response.data["detail"])

    def test_a_human_report_can_still_be_overridden(self):
        # A false positive must never block real work, so an explicit species
        # goes through — carrying a warning rather than a silent pass.
        response = self._post(is_human=True, species="canine")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["patient"]["species"], "canine")
        self.assertIn("reads as a human CBC", response.data["notice"])
        self.assertIn("Canine intervals", response.data["notice"])

    def test_the_flag_defaults_to_false_when_the_model_omits_it(self):
        from cbc_analyzer.services.cbc_analyzer import _clean_extraction

        cleaned = _clean_extraction({"values": {}, "is_cbc_report": True})
        self.assertFalse(cleaned["is_human_report"])


class MultiSpeciesIntervalTests(TestCase):
    """
    The table covers more than dogs and cats. These pin the behaviour that makes
    the wider set safe rather than just longer.
    """

    def test_every_listed_species_has_its_own_table(self):
        from cbc_analyzer.reference import (
            SPECIES_CHOICES,
            SUPPORTED_SPECIES,
            intervals_for,
        )

        listed = {key for key, _ in SPECIES_CHOICES if key != "other"}
        self.assertEqual(listed, set(SUPPORTED_SPECIES))
        for species in SUPPORTED_SPECIES:
            with self.subTest(species=species):
                # A table that is present but empty would silently mark every
                # value "not assessed", which looks like it worked.
                self.assertGreater(len(intervals_for(species)), 5)

    def test_the_same_value_flips_verdict_across_species(self):
        # MCV 45 fL: normal for a cat, low for a dog, normal for a horse.
        for species, expected in (
            ("feline", "normal"),
            ("canine", "low"),
            ("equine", "normal"),
            ("caprine", "high"),
        ):
            with self.subTest(species=species):
                result = evaluate_panel({"mcv": 45.0}, species)
                self.assertEqual(result["results"][0]["status"], expected)

    def test_a_horse_panel_is_flagged_against_equine_ranges(self):
        # PLT 150 is normal for a horse (100-350) and low for a dog (200-500).
        self.assertEqual(
            evaluate_panel({"plt": 150.0}, "equine")["result_status"], "normal"
        )
        self.assertEqual(
            evaluate_panel({"plt": 150.0}, "canine")["result_status"], "low"
        )

    def test_other_is_permissive_rather_than_wrong(self):
        # The union spans every species, so a value normal for any of them is not
        # flagged — inventing a finding on an unsupported species is worse.
        result = evaluate_panel({"mcv": 45.0, "plt": 150.0}, "other")
        self.assertEqual(result["result_status"], "normal")
        self.assertEqual(result["species"], "other")
        self.assertIn("No validated interval", result["caveat"])

    def test_an_out_of_range_value_is_still_flagged_for_other(self):
        # Beyond every species' range, so permissive is not the same as blind.
        result = evaluate_panel({"mcv": 400.0}, "other")
        self.assertEqual(result["results"][0]["status"], "high")


class NotAssessedTests(TestCase):
    """
    An analyte with no interval for the species must not be called normal. Birds
    have heterophils rather than neutrophils, so those rows have no avian range.
    """

    def test_avian_neutrophils_are_not_assessed(self):
        result = evaluate_panel(
            {"hgb": 15.0, "neut_seg_abs": 5.0, "plt": 400.0}, "avian"
        )
        by_key = {entry["key"]: entry for entry in result["results"]}

        self.assertEqual(by_key["hgb"]["status"], "normal")
        self.assertEqual(by_key["neut_seg_abs"]["status"], "not_assessed")
        self.assertEqual(by_key["plt"]["status"], "not_assessed")
        self.assertEqual(
            by_key["neut_seg_abs"]["reference_label"], "no reference interval"
        )

    def test_unassessed_values_never_reach_the_verdict(self):
        # Only the haemoglobin can be judged, and it is normal — so the record is
        # normal, not "abnormal" because two rows had no range.
        result = evaluate_panel(
            {"hgb": 15.0, "neut_seg_abs": 5.0, "plt": 400.0}, "avian"
        )
        self.assertEqual(result["result_status"], "normal")
        self.assertEqual(result["flags"], [])
        self.assertEqual(
            [entry["key"] for entry in result["not_assessed"]],
            ["neut_seg_abs", "plt"],
        )

    def test_the_avian_caveat_explains_why(self):
        result = evaluate_panel({"hgb": 15.0}, "avian")
        self.assertIn("heterophils", result["caveat"])
        self.assertIn("thrombocytes", result["caveat"])

    def test_mammals_carry_no_caveat(self):
        for species in ("canine", "feline", "equine", "rabbit"):
            with self.subTest(species=species):
                self.assertEqual(evaluate_panel({"hgb": 14.0}, species)["caveat"], "")

    def test_a_saved_record_keeps_the_unassessed_rows(self):
        vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=vet, user_type="professional")
        client = APIClient()
        client.force_authenticate(user=vet)

        response = client.post(
            "/api/cbc/logs/",
            {
                "species": "avian",
                "pet_name": "Kiwi",
                "values": {"hgb": 15.0, "plt": 400.0},
                "key_findings": "Reviewed",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        statuses = {
            entry["key"]: entry["status"]
            for entry in response.data["evaluation"]["results"]
        }
        self.assertEqual(statuses["plt"], "not_assessed")
        self.assertEqual(response.data["result_status"], "normal")
        self.assertEqual(response.data["flag_count"], 0)


class MedicalLogSummaryTests(TestCase):
    """
    The dashboard tiles are scoped to the same filters as the table, and their
    deltas compare the selected window against the one immediately before it.
    """

    def setUp(self):
        self.client = APIClient()
        self.vet = User.objects.create(username="vet")
        UserProfile.objects.create(user=self.vet, user_type="professional")
        self.client.force_authenticate(user=self.vet)

    def _log(self, *, days_ago, status="normal", species="canine"):
        from datetime import timedelta

        from django.utils import timezone

        return MedicalLog.objects.create(
            user=self.vet,
            species=species,
            pet_name="Patient",
            values={"hgb": 14.0},
            result_status=status,
            test_date=timezone.localdate() - timedelta(days=days_ago),
        )

    def test_the_window_scopes_the_counts(self):
        self._log(days_ago=2)
        self._log(days_ago=40)

        windowed = self.client.get("/api/cbc/logs/summary/?days=30")
        all_time = self.client.get("/api/cbc/logs/summary/")

        self.assertEqual(windowed.data["total"], 1)
        self.assertEqual(all_time.data["total"], 2)

    def test_the_delta_compares_against_the_preceding_window(self):
        # Current 30 days: 3 normal. Previous 30 days: 2 normal. +50%.
        for days in (1, 2, 3):
            self._log(days_ago=days)
        for days in (35, 40):
            self._log(days_ago=days)

        summary = self.client.get("/api/cbc/logs/summary/?days=30")

        self.assertEqual(summary.data["normal"], 3)
        self.assertEqual(summary.data["normal_change"], 50)
        self.assertEqual(summary.data["window_days"], 30)

    def test_a_negative_delta_is_reported(self):
        self._log(days_ago=1, status="low")
        for days in (35, 40, 45, 50):
            self._log(days_ago=days, status="low")

        summary = self.client.get("/api/cbc/logs/summary/?days=30")

        self.assertEqual(summary.data["abnormal"], 1)
        self.assertEqual(summary.data["abnormal_change"], -75)

    def test_no_baseline_means_no_delta(self):
        # Nothing in the preceding window, so a percentage would divide by zero.
        self._log(days_ago=2)

        summary = self.client.get("/api/cbc/logs/summary/?days=30")

        self.assertEqual(summary.data["normal"], 1)
        self.assertIsNone(summary.data["normal_change"])

    def test_other_filters_scope_the_tiles_too(self):
        self._log(days_ago=1, species="canine")
        self._log(days_ago=1, species="feline")

        summary = self.client.get("/api/cbc/logs/summary/?days=30&species=feline")

        self.assertEqual(summary.data["total"], 1)

    def test_this_month_ignores_the_window_but_not_the_species(self):
        from django.utils import timezone

        # Same calendar month, but outside a 7-day window.
        first_of_month = timezone.localdate().replace(day=1)
        MedicalLog.objects.create(
            user=self.vet,
            species="canine",
            values={"hgb": 14.0},
            test_date=first_of_month,
        )
        MedicalLog.objects.create(
            user=self.vet,
            species="feline",
            values={"hgb": 14.0},
            test_date=first_of_month,
        )

        summary = self.client.get("/api/cbc/logs/summary/?days=7&species=canine")

        self.assertEqual(summary.data["this_month"], 1)


class SeedMedicalLogCommandTests(TestCase):
    """
    The seed command exists to make four derived tiles land on fixed numbers,
    so the numbers themselves are the thing worth pinning. The dated parts are
    tested against a fixed "today" rather than the clock, since `this_month`
    depends on where in the month the command runs.
    """

    def setUp(self):
        self.client = APIClient()
        self.vet = User.objects.create(
            username="seed-vet", email="seed-vet@example.com", first_name="Ines"
        )
        UserProfile.objects.create(user=self.vet, user_type="professional")
        self.client.force_authenticate(user=self.vet)

    def _seed(self, *args):
        out = io.StringIO()
        call_command(
            "seed_medical_log",
            "--user-id",
            str(self.vet.pk),
            *args,
            stdout=out,
            stderr=out,
        )
        return out.getvalue()

    def test_tiles_match_the_mock(self):
        self._seed()

        summary = self.client.get("/api/cbc/logs/summary/?days=30")

        self.assertEqual(summary.data["total"], 128)
        self.assertEqual(summary.data["normal"], 89)
        self.assertEqual(summary.data["total"] - summary.data["normal"], 39)
        # +12% is unreachable with normal pinned at 89; see the command's notes.
        self.assertEqual(summary.data["normal_change"], 13)
        self.assertEqual(summary.data["abnormal_change"], -2)

    def test_this_month_reaches_fourteen_mid_month(self):
        plans, warnings = build_plan(date(2026, 2, 12))
        month_start = date(2026, 2, 1)

        self.assertEqual(warnings, [])
        self.assertEqual(
            sum(1 for plan in plans if plan.test_date >= month_start), 14
        )

    def test_a_window_inside_one_month_is_reported_not_faked(self):
        # Aug 31: the trailing 30 days sit entirely inside August, so no record
        # can count toward the window without also counting toward the month.
        plans, warnings = build_plan(date(2026, 8, 31))
        window = [
            plan for plan in plans if plan.test_date >= date(2026, 8, 1)
        ]

        self.assertEqual(len(warnings), 1)
        self.assertIn("This month", warnings[0])
        # The window total still holds; only the month tile is off.
        self.assertEqual(len(window), 128)

    def test_every_status_is_derived_from_its_values(self):
        self._seed()

        for log in MedicalLog.objects.filter(user=self.vet):
            with self.subTest(record=log.record_id):
                recomputed = evaluate_panel(log.values, log.species)
                self.assertEqual(log.result_status, recomputed["result_status"])
                self.assertEqual(log.flag_count, len(recomputed["flags"]))
                self.assertEqual(log.evaluation["results"], recomputed["results"])

    def test_first_page_reproduces_the_mock_rows(self):
        self._seed()

        page = list(
            MedicalLog.objects.filter(user=self.vet).order_by(
                "-test_date", "-created_at"
            )[:8]
        )

        self.assertEqual(
            [(log.pet_name, log.result_status) for log in page],
            [
                ("Dusty", "normal"),
                ("Mittens", "low"),
                ("Rex", "high"),
                ("Luna", "normal"),
                ("Bella", "low"),
                ("Simba", "normal"),
                ("Cooper", "high"),
                ("Nala", "normal"),
            ],
        )

    def test_records_outside_the_roster_survive_a_flush(self):
        keeper = MedicalLog.objects.create(
            user=self.vet,
            pet_name="Mr Dummy",
            species="canine",
            values={"hgb": 14.0},
        )

        output = self._seed("--flush")

        self.assertTrue(MedicalLog.objects.filter(pk=keeper.pk).exists())
        self.assertIn("outside the seed roster", output)

    def test_an_existing_seed_is_not_silently_doubled(self):
        self._seed()

        with self.assertRaises(CommandError):
            self._seed()

        self.assertEqual(MedicalLog.objects.filter(user=self.vet).count(), 247)

    def test_an_ambiguous_email_is_refused_with_the_candidates(self):
        twin = User.objects.create(
            username="seed-vet-twin", email="seed-vet@example.com"
        )
        UserProfile.objects.create(user=twin, user_type="student")

        with self.assertRaises(CommandError) as caught:
            call_command(
                "seed_medical_log",
                "--email",
                "seed-vet@example.com",
                stdout=io.StringIO(),
            )

        message = str(caught.exception)
        self.assertIn(f"--user-id {self.vet.pk}", message)
        self.assertIn(f"--user-id {twin.pk}", message)
        self.assertEqual(MedicalLog.objects.count(), 0)
