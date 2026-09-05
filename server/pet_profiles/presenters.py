from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.utils import timezone

from pet_profiles.models import (
    Appointment,
    AppointmentStatus,
    CareEvent,
    Medication,
    Pet,
    PetDocument,
    Vaccination,
    WeightEntry,
)

DISPLAY_TZ = ZoneInfo("Asia/Manila")
VACCINE_SOON_DAYS = 45
IDEAL_WEIGHT_TOLERANCE = Decimal("0.10")

_SEX_LABELS = {"male": "Male", "female": "Female", "unknown": "Sex not set"}
_NEUTER_LABELS = {"neutered": "Neutered", "spayed": "Spayed", "intact": "Intact"}

_FORM_ICONS = {"pill": "pill", "liquid": "pill", "topical": "pill", "chew": "chew"}

_CADENCE_TONES = {
    "daily": "neutral",
    "weekly": "primary",
    "monthly": "primary",
    "quarterly": "primary",
    "as_needed": "neutral",
}

_EVENT_ICONS = {
    "weight": "scale",
    "dose": "flask",
    "vaccination": "syringe",
    "appointment": "calendar",
    "document": "file",
    "pet": "paw",
}

_EVENT_TONES = {
    "weight": "tertiary",
    "dose": "primary",
    "vaccination": "primary",
    "appointment": "secondary",
    "document": "neutral",
    "pet": "primary",
}


def _today() -> date:
    return timezone.now().astimezone(DISPLAY_TZ).date()


def _local(moment: datetime) -> datetime:
    return timezone.localtime(moment, DISPLAY_TZ)


def local_date(moment: datetime) -> date:
    """
    The calendar day a timestamp falls on for the owner.
    """
    return _local(moment).date()


def _day_month(value: date) -> str:
    """`Nov 15` — the short form used all over the cards."""
    return f"{value.strftime('%b')} {value.day}"


def _clock(moment: datetime) -> str:
    hour = moment.hour % 12 or 12
    meridiem = "AM" if moment.hour < 12 else "PM"
    return f"{hour}:{moment.minute:02d} {meridiem}"


def _relative_days(value: date) -> str:
    """"in 12 days" / "today" / "3 days ago", from the owner's point of view."""
    delta = (value - _today()).days
    if delta == 0:
        return "today"
    if delta == 1:
        return "tomorrow"
    if delta == -1:
        return "yesterday"
    if delta > 0:
        if delta < 45:
            return f"in {delta} days"
        months = round(delta / 30)
        return f"in {months} month{'s' if months != 1 else ''}"
    overdue = -delta
    if overdue < 45:
        return f"{overdue} days ago"
    months = round(overdue / 30)
    return f"{months} month{'s' if months != 1 else ''} ago"


def _trim(value: Decimal) -> str:
    """`31.40` → `31.4`, `4.00` → `4`. Weights read badly with dead zeros."""
    text = f"{value.normalize():f}"
    return text.rstrip("0").rstrip(".") if "." in text else text


def _status(label: str, tone: str) -> dict:
    return {"label": label, "tone": tone}


# ── pet identity ────────────────────────────────────────────────────────────


def _age_label(pet: Pet) -> str:
    months = pet.age_months
    if months is None:
        age = "Age not set"
    elif months < 1:
        age = "Newborn"
    elif months < 24:
        age = f"{months} mo old"
    else:
        age = f"{months // 12} yrs old"

    sex = _SEX_LABELS.get(pet.sex, "Sex not set")
    neuter = _NEUTER_LABELS.get(pet.neuter_status)
    return f"{age} · {sex} ({neuter})" if neuter else f"{age} · {sex}"


def _weight_label(pet: Pet, latest: WeightEntry | None) -> str:
    if latest is None:
        return "Weight not logged yet"

    weight = f"{_trim(latest.weight_kg)} kg"
    if pet.ideal_weight_kg is None:
        return f"{weight} · logged {_relative_days(latest.recorded_on)}"

    drift = abs(latest.weight_kg - pet.ideal_weight_kg)
    if pet.ideal_weight_kg and drift / pet.ideal_weight_kg <= IDEAL_WEIGHT_TOLERANCE:
        return f"{weight} · Ideal weight"
    heavier = latest.weight_kg > pet.ideal_weight_kg
    return f"{weight} · {_trim(drift)} kg {'over' if heavier else 'under'} target"


def _tags(pet: Pet, vaccinations: list[Vaccination]) -> list[dict]:
    """
    The chips under a pet's name.
    """
    tags: list[dict] = []

    overdue = [v for v in vaccinations if v.is_overdue]
    upcoming = sorted(
        (v for v in vaccinations if v.is_upcoming and v.due_on),
        key=lambda v: v.due_on,
    )

    days_to_next = (
        (upcoming[0].due_on - _today()).days if upcoming else None
    )
    needs_attention = bool(overdue) or (
        days_to_next is not None and days_to_next <= VACCINE_SOON_DAYS
    )

    if overdue:
        tags.append(
            {"label": "Vaccine overdue", "tone": "secondary", "icon": "clock"}
        )
    elif needs_attention:
        tags.append(
            {
                "label": (
                    f"Vaccine due in {days_to_next} days"
                    if days_to_next and days_to_next > 1
                    else "Vaccine due"
                ),
                "tone": "secondary",
                "icon": "clock",
            }
        )
    elif vaccinations:
        tags.append(
            {"label": "Vaccines up to date", "tone": "primary", "icon": "shield"}
        )

    if pet.insurance_provider:
        tags.append(
            {"label": pet.insurance_provider, "tone": "neutral", "icon": "heart"}
        )
    if pet.indoor_only:
        tags.append({"label": "Indoor only", "tone": "neutral", "icon": "home"})

    if not tags:
        tags.append(
            {"label": "Nothing saved yet", "tone": "neutral", "icon": "dot"}
        )
    elif not needs_attention and vaccinations:
        tags.append(
            {"label": "Healthy & thriving", "tone": "primary", "icon": "dot"}
        )

    return tags


def _last_checkup_label(pet: Pet) -> str:
    """
    The date of the most recent visit that actually happened.
    """
    visits = [
        appointment
        for appointment in pet.appointments.all()
        if appointment.status == AppointmentStatus.COMPLETED
    ]
    if not visits:
        return "No visits logged"
    latest = max(visits, key=lambda appointment: appointment.starts_at)
    seen = _local(latest.starts_at).date()
    return f"{_day_month(seen)}, {seen.year}"


def pet_summary(pet: Pet, vaccinations: list[Vaccination]) -> dict:
    """A `FurParentPet` — what the family grid draws."""
    latest = pet.latest_weight
    return {
        "id": str(pet.id),
        "name": pet.name,
        "breed": pet.breed or pet.get_species_display(),
        "species": pet.species,
        "photoUrl": pet.photo_url or None,
        "ageLabel": _age_label(pet),
        "weightLabel": _weight_label(pet, latest),
        "weightValue": f"{_trim(latest.weight_kg)} kg" if latest else "—",
        "lastCheckupLabel": _last_checkup_label(pet),
        "tags": _tags(pet, vaccinations),
        "favourite": pet.is_favourite,
    }


# ── wellness sections ───────────────────────────────────────────────────────


def _vitals(pet: Pet, weights: list[WeightEntry]) -> dict:
    """
    Weight and its trend — the only vitals this product actually measures.
    """
    metrics: list[dict] = []
    status = _status("Nothing logged yet", "neutral")

    if weights:
        latest = weights[0]
        note = "Logged " + _relative_days(latest.recorded_on)
        if pet.ideal_weight_kg is not None:
            note = f"Target {_trim(pet.ideal_weight_kg)} kg"
        metrics.append(
            {
                "label": "Weight",
                "icon": "scale",
                "value": _trim(latest.weight_kg),
                "unit": "kg",
                "note": note,
            }
        )

        if len(weights) > 1:
            previous = weights[1]
            delta = latest.weight_kg - previous.weight_kg
            sign = "+" if delta > 0 else ""
            metrics.append(
                {
                    "label": "Change",
                    "icon": "steps",
                    "value": f"{sign}{_trim(delta)}" if delta else "0",
                    "unit": "kg",
                    "note": f"Since {_day_month(previous.recorded_on)}",
                }
            )

        status = _status("Looking good", "primary")
        if pet.ideal_weight_kg:
            drift = abs(latest.weight_kg - pet.ideal_weight_kg)
            if drift / pet.ideal_weight_kg > IDEAL_WEIGHT_TOLERANCE:
                status = _status("Keep an eye on it", "tertiary")

    return {
        "status": status,
        "metrics": metrics,
        "gauge": None,
        "trend": _weight_trend(weights),
    }

TREND_POINTS = 8

def _weight_trend(weights: list[WeightEntry]) -> dict | None:
    """
    The weight curve the vitals card draws, or `None` with nothing to plot.
    """
    if not weights:
        return None

    window = list(reversed(weights[:TREND_POINTS]))
    latest = window[-1]
    first = window[0]

    delta = latest.weight_kg - first.weight_kg
    span = (latest.recorded_on - first.recorded_on).days
    if len(window) == 1:
        change = "First weight saved"
    elif delta == 0:
        change = f"Steady over {span} days" if span else "Steady"
    else:
        sign = "+" if delta > 0 else "−"
        since = f"since {_day_month(first.recorded_on)}"
        change = f"{sign}{_trim(abs(delta))} kg {since}"

    return {
        "value": _trim(latest.weight_kg),
        "unit": "kg",
        "change": change,
        "rising": delta > 0,
        "points": [
            {
                "label": _day_month(entry.recorded_on),
                "value": float(entry.weight_kg),
            }
            for entry in window
        ],
    }


def _month_year(value: date) -> str:
    return f"{value.strftime('%b')} {value.year}"


def _vaccination_detail(vaccination: Vaccination) -> str:
    """
    The row's left-hand line: where the dose came from, or what it is for.
    """
    if vaccination.clinic:
        return f"Given at {vaccination.clinic}"
    if vaccination.notes:
        return vaccination.notes
    if vaccination.administered_on:
        return f"Given {_day_month(vaccination.administered_on)} {vaccination.administered_on.year}"
    return "No clinic saved"


def _vaccination_validity(vaccination: Vaccination) -> str:
    """
    The row's right-hand line: the one date that decides anything.
    """
    if vaccination.is_overdue:
        return f"Overdue since {_day_month(vaccination.due_on)}"
    if vaccination.due_on:
        if (vaccination.due_on - _today()).days <= VACCINE_SOON_DAYS:
            return f"Due {_relative_days(vaccination.due_on)}"
        return f"Good until {_month_year(vaccination.due_on)}"
    if vaccination.administered_on:
        return f"Given {_month_year(vaccination.administered_on)}"
    return "No dates saved"


def _vaccination_state(vaccination: Vaccination) -> str:
    """
    Which of the three states the client should rank this record as.

    `overdue` is its own state, not a flavour of `active`: the attention panel
    ranks on this field, so a lapsed shot folded in with the ones in force is
    how the most urgent thing on the page ends up invisible.

    `upcoming` is reserved for a dose actually near — a rabies booster due in
    23 months is *in force*, not pending, and calling it upcoming would put it
    on the owner's reminder list every day for two years. The record's own
    detail line still names the date either way.
    """
    if vaccination.is_overdue:
        return "overdue"
    if vaccination.due_on and (vaccination.due_on - _today()).days <= (
        VACCINE_SOON_DAYS
    ):
        return "upcoming"
    return "active"


def _vaccinations(vaccinations: list[Vaccination]) -> dict:
    if not vaccinations:
        return {"status": _status("Nothing saved yet", "neutral"), "records": []}

    today = _today()
    soon = [
        v
        for v in vaccinations
        if v.due_on and 0 <= (v.due_on - today).days <= VACCINE_SOON_DAYS
    ]
    overdue = [v for v in vaccinations if v.is_overdue]

    if overdue:
        status = _status("Overdue", "secondary")
    elif soon:
        status = _status("Due soon", "secondary")
    else:
        status = _status("Up to date", "primary")

    return {
        "status": status,
        "records": [
            {
                "name": v.name,
                "detail": _vaccination_detail(v),
                "validity": _vaccination_validity(v),
                "state": _vaccination_state(v),
            }
            for v in vaccinations
        ],
    }


def _medication_note(medication: Medication) -> tuple[str, str]:
    """The card's third line, and the tone it carries."""
    latest = medication.latest_dose
    if latest is not None:
        given = _local(latest.given_at)
        if given.date() == _today():
            return f"Given today at {_clock(given)}", "primary"

    if medication.next_due_on:
        return (
            f"Next dose: {_day_month(medication.next_due_on)} "
            f"({_relative_days(medication.next_due_on)})",
            "tertiary",
        )
    if latest is not None:
        return f"Last given {_relative_days(_local(latest.given_at).date())}", "neutral"
    return "No doses logged yet", "tertiary"


def _next_dose_label(medication: Medication) -> str | None:
    """
    When the following dose lands — kept apart from the row's note.

    `None` for an as-needed regimen, which has no schedule to be next on.
    """
    if not medication.next_due_on:
        return None
    return (
        f"Next dose {_day_month(medication.next_due_on)} "
        f"({_relative_days(medication.next_due_on)})"
    )


def _medications(medications: list[Medication]) -> dict:
    active = [m for m in medications if m.is_active]
    if not active:
        return {"status": _status("None right now", "neutral"), "records": []}

    records = []
    for medication in active:
        note, note_tone = _medication_note(medication)
        records.append(
            {
                "id": str(medication.id),
                "name": medication.name,
                "detail": medication.detail or medication.get_form_display(),
                "cadence": medication.get_cadence_display(),
                "cadenceTone": _CADENCE_TONES.get(medication.cadence, "neutral"),
                "note": note,
                "noteTone": note_tone,
                "nextDue": _next_dose_label(medication),
                "icon": _FORM_ICONS.get(medication.form, "pill"),
            }
        )

    due = any(record["noteTone"] == "tertiary" for record in records)
    return {
        "status": _status("Doses to give" if due else "All given", "neutral"),
        "records": records,
    }


def _appointment(appointment: Appointment | None) -> dict | None:
    if appointment is None:
        return None

    starts = _local(appointment.starts_at)
    return {
        "id": str(appointment.pk),
        "badge": _day_month(starts.date()),
        "clinic": appointment.clinic or "Clinic not saved",
        "vetName": appointment.vet_name or "Vet not saved",
        "vetRole": appointment.vet_role or "Your vet",
        "vetPhotoUrl": None,
        "title": appointment.title,
        "when": (
            f"{starts.strftime('%A, %b')} {starts.day} at {_clock(starts)}"
        ),
        "startsAt": starts.strftime("%Y-%m-%dT%H:%M"),
        "address": appointment.address,
    }


def _passport(pet: Pet, documents: list[PetDocument]) -> dict:
    records: list[dict] = []

    if pet.microchip_number:
        records.append(
            {
                "label": "Microchip number",
                "value": f"#{pet.microchip_number.lstrip('#')}",
                "icon": "chip",
                "mono": True,
            }
        )

    if pet.insurance_provider:
        policy = f" · {pet.insurance_policy}" if pet.insurance_policy else ""
        records.append(
            {
                "label": "Pet insurance",
                "value": f"{pet.insurance_provider}{policy}",
                "icon": "verified",
            }
        )

    for document in documents:
        uploaded = _local(document.uploaded_at)
        note = f" · {document.note}" if document.note else ""
        records.append(
            {
                "label": document.label,
                "value": f"Uploaded {_day_month(uploaded.date())}{note}",
                "icon": "document",
            }
        )

    if not records:
        records.append(
            {
                "label": "Nothing saved yet",
                "value": "Add a microchip number, insurance, or a photo of any vet paper",
                "icon": "document",
            }
        )

    status = (
        _status("Insurance on file", "primary")
        if pet.insurance_provider
        else _status("No insurance added", "neutral")
    )
    return {"status": status, "records": records}


def _synced_label(pet: Pet) -> str:
    updated = _local(pet.updated_at)
    where = f"with {pet.clinic_name}" if pet.clinic_name else "from your records"
    return f"Last updated {where} · {_day_month(updated.date())}"


def pet_wellness(
    pet: Pet,
    *,
    weights: list[WeightEntry],
    vaccinations: list[Vaccination],
    medications: list[Medication],
    appointment: Appointment | None,
    documents: list[PetDocument],
) -> dict:
    """
    A `PetWellness` — everything the six health cards read.
    """
    return {
        "petId": str(pet.id),
        "syncedLabel": _synced_label(pet),
        "vitals": _vitals(pet, weights),
        "vaccinations": _vaccinations(vaccinations),
        "medications": _medications(medications),
        "appointment": _appointment(appointment),
        "screening": None,
        "passport": _passport(pet, documents),
    }


# ── timeline ────────────────────────────────────────────────────────────────


def _time_label(moment: datetime) -> str:
    local = _local(moment)
    delta = (_today() - local.date()).days
    if delta == 0:
        return f"Today, {_clock(local)}"
    if delta == 1:
        return f"Yesterday, {_clock(local)}"
    if delta < 7:
        return local.strftime("%A")
    return _day_month(local.date())


def care_event(event: CareEvent) -> dict:
    """A `CareEvent` for the timeline section."""
    return {
        "id": str(event.id),
        "title": event.title,
        "detail": event.detail,
        "timeLabel": _time_label(event.occurred_at),
        "tone": _EVENT_TONES.get(event.kind, "neutral"),
        "icon": _EVENT_ICONS.get(event.kind, "paw"),
    }


def next_appointment(pet: Pet) -> Appointment | None:
    """The soonest visit still ahead of the owner."""
    return (
        pet.appointments.filter(
            status=AppointmentStatus.BOOKED, starts_at__gte=timezone.now()
        )
        .order_by("starts_at")
        .first()
    )
