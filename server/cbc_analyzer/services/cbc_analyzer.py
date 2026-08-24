"""
Gemini-backed helpers for the CBC analyzer.

Two distinct jobs, deliberately kept as separate model calls:

1. `extract_panel` reads a photographed or scanned CBC report and transcribes the
   numbers.  It is pure transcription — the model is told not to interpret.
2. `interpret` writes the narrative brief.  It is handed the *already flagged*
   panel from `cbc_analyzer.reference`, so it never decides whether a value is
   high or low; it only explains the pattern it is given.

Splitting them keeps the clinical flags reproducible while still letting the
model do the two things it is genuinely good at: reading a messy lab printout and
writing a readable paragraph.
"""

import base64
import json
import logging

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from cbc_analyzer.reference import (
    ANALYTE_KEYS,
    PANEL,
    SERIES_LABELS,
    SPECIES_CHOICES,
    SUPPORTED_SPECIES,
)
from config.pysecrets import GAPI_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

if not GAPI_KEY:
    raise ValueError("Gemini API key not found.")

_llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL, temperature=0.1, api_key=GAPI_KEY, thinking_budget=4000
)


def _analyte_catalogue() -> str:
    """The analyte list, grouped by series, for use inside a prompt."""
    lines: list[str] = []
    current_series = None
    for analyte in PANEL:
        if analyte.series != current_series:
            current_series = analyte.series
            lines.append(f"\n{SERIES_LABELS[current_series]}:")
        optional = " (optional)" if analyte.optional else ""
        lines.append(
            f'  - "{analyte.key}": {analyte.label} in {analyte.unit}{optional}'
        )
    return "\n".join(lines)


EXTRACTION_SCHEMA = """
{
  "values": { "<analyte_key>": number | null },
  "patient": {
    "pet_name": string,
    "owner_name": string,
    "species": <one of the species keys listed below> | "other" | "",
    "species_label": string,
    "breed": string,
    "age_years": number | null,
    "sex": "male" | "female" | "unknown",
    "neuter_status": "intact" | "neutered" | "spayed" | "unknown"
  },
  "sample_quality": ["hemolyzed" | "lipemic" | "clotted"],
  "smear_morphology": string,
  "is_cbc_report": boolean,
  "is_human_report": boolean,
  "unreadable_reason": string
}"""


INTERPRETATION_SCHEMA = """
{
  "key_findings": string,
  "diagnostic_brief": string,
  "clinical_notes": string
}"""


class CBCAnalyzer:
    def __init__(self, model_name: str | None = None):
        if model_name:
            self.model = ChatGoogleGenerativeAI(
                model=model_name, temperature=0.1, api_key=GAPI_KEY
            )
        else:
            self.model = _llm

    # ── Report transcription ────────────────────────────────────────────────

    def extract_panel(self, image_file) -> dict:
        """
        Transcribe a CBC report image into analyte values and patient context.

        Returns the parsed payload with unknown keys dropped and every value
        coerced to a float, so the caller can feed it straight into the panel
        evaluator.  Raises ValueError when the image is empty or the model does
        not return usable JSON.
        """
        image_bytes = image_file.read()
        if not image_bytes:
            raise ValueError("The uploaded report image is empty.")

        content_type = getattr(image_file, "content_type", "image/jpeg") or "image/jpeg"
        encoded = base64.b64encode(image_bytes).decode("utf-8")

        prompt = (
            "You are a veterinary laboratory data-entry assistant. Transcribe the "
            "complete blood count (CBC) report in this image into JSON.\n\n"
            "Return ONLY valid JSON matching this exact schema:\n"
            f"{EXTRACTION_SCHEMA}\n\n"
            "The analyte keys you may use, with the unit each value must be "
            "converted to:\n"
            f"{_analyte_catalogue()}\n\n"
            "Transcription rules:\n"
            "- Transcribe only. Do NOT interpret, flag, or comment on any value, "
            "and do NOT copy the reference ranges printed on the report.\n"
            "- Use null for any analyte that is not printed on the report. Never "
            "guess, estimate, or derive a missing value.\n"
            "- Convert every value into the unit listed above. Common conversions: "
            "WBC and differential absolutes reported as /uL or cells/mm3 divide by "
            "1000 to reach 10^9/L; RBC reported as x10^6/uL is already 10^12/L; "
            "HCT/PCV reported as L/L multiply by 100 to reach %; PLT reported as "
            "/uL divide by 1000 to reach 10^9/L. Reticulocyte absolutes stay in "
            "/uL.\n"
            "- If a differential is printed only as a percentage, fill the _pct "
            "key and leave the _abs key null (and vice versa). Do not compute one "
            "from the other.\n"
            '- "sample_quality": include a flag only when the report explicitly '
            "notes it. Otherwise return an empty list.\n"
            '- "smear_morphology": copy any blood smear or morphology comment '
            "verbatim. Empty string when absent.\n"
            '- "patient": fill only what is printed on the report. Use "" or null '
            "for anything absent.\n"
            '- "patient.species": one of these keys, and only when the report '
            f"actually names the species: {_species_keys()}. Use \"other\" when "
            "the report names a species that is not in that list — a reptile, a "
            'camelid. Use "" when the report does not say which species it is; '
            'do NOT fall back to "other" for that, because "" means "the report '
            'is silent" and "other" means "a species outside the list".\n'
            '- "is_cbc_report": false when the image is not a haematology report '
            "at all (a photo of an animal, a receipt, a blank page, an unrelated "
            'document). When false, set every value to null and explain in '
            '"unreadable_reason".\n'
            '- "is_human_report": true when the report is for a HUMAN patient '
            "rather than an animal. Tells include a human patient name and an "
            '"Age/Gender 34/Male" style line, a human pathology or diagnostic '
            "laboratory, and printed reference intervals that are human rather "
            "than veterinary (for example RBC 4.5-5.5 million/cumm, MCV 81-101 "
            "fL, or MCH 27-32 pg). A veterinary report normally names a species, "
            "a breed, or an owner. Set false when the report is clearly "
            "veterinary or when you genuinely cannot tell.\n"
            '- "unreadable_reason": one short sentence, or "" when the report read '
            "cleanly."
        )

        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{content_type};base64,{encoded}",
                        "detail": "high",
                    },
                },
            ]
        )

        parsed = _safe_json_loads(self.model.invoke([message]).content)
        return _clean_extraction(parsed)

    # ── Narrative interpretation ────────────────────────────────────────────

    def interpret(
        self,
        patient: dict,
        evaluation: dict,
        sample_quality: list[str] | None = None,
        smear_morphology: str = "",
    ) -> dict:
        """
        Write the diagnostic brief for an already-flagged panel.

        `evaluation` is the output of `reference.evaluate_panel`; the flags in it
        are treated as ground truth by the prompt.
        """
        prompt = (
            "You are a veterinary clinical pathologist writing a short diagnostic "
            "brief for a qualified veterinarian. The complete blood count below "
            "has ALREADY been compared against validated species-specific "
            "reference intervals by the laboratory system.\n\n"
            f"Patient:\n{_render_patient(patient)}\n\n"
            f"Panel results:\n{_render_results(evaluation)}\n\n"
            f"Out-of-range parameters:\n{_render_flags(evaluation)}\n\n"
            f"{_render_caveat(evaluation)}"
            f"Sample quality flags: {', '.join(sample_quality or []) or 'none reported'}\n"
            f"Blood smear / morphology: {smear_morphology.strip() or 'not provided'}\n\n"
            "Return ONLY valid JSON matching this exact schema:\n"
            f"{INTERPRETATION_SCHEMA}\n\n"
            "Field rules:\n"
            '- "key_findings": at most 70 characters, a scannable label for this '
            'record in a table (e.g. "Mild monocytosis, stress response" or '
            '"Normal panel, healthy indices"). No trailing full stop.\n'
            '- "diagnostic_brief": 2-4 sentences. Open by stating which series are '
            "within normal limits, then name each abnormality using its clinical "
            "term (anaemia, neutrophilia, lymphopenia, thrombocytopenia, "
            "monocytosis, eosinophilia...) with a severity qualifier, and give the "
            "most likely reasons. Close with a clinical correlation or follow-up "
            "recommendation.\n"
            '- "clinical_notes": 3-5 sentences of deeper interpretation for the '
            "record: the pattern the indices form, what it does and does not rule "
            "out, the effect of any sample quality flag on confidence, and a "
            'concrete next step prefixed with "Recommendation:".\n\n'
            "Hard constraints:\n"
            "- NEVER contradict the flags above. Do not call a value abnormal when "
            "it is marked normal, and do not call a value normal when it is "
            "flagged. Do not restate or revise any reference interval.\n"
            "- A parameter marked NOT_ASSESSED has no validated interval for this "
            "species. Never call it normal or abnormal. Mention it only to say it "
            "could not be assessed, and only if it matters to the picture.\n"
            "- Comment only on parameters that were actually submitted. Say a "
            "parameter is unavailable rather than inferring it.\n"
            "- When a sample quality flag is present, state which indices it can "
            "artefactually shift.\n"
            "- Write for a clinician: precise, hedged where the data is thin, and "
            "free of pet-owner reassurance.\n"
            "- This is decision support, not a diagnosis. Never state a definitive "
            "diagnosis from a CBC alone."
        )

        parsed = _safe_json_loads(
            self.model.invoke([HumanMessage(content=prompt)]).content
        )
        if not isinstance(parsed, dict):
            raise ValueError("The AI returned an unexpected interpretation payload.")

        return {
            "key_findings": str(parsed.get("key_findings") or "").strip()[:255],
            "diagnostic_brief": str(parsed.get("diagnostic_brief") or "").strip(),
            "clinical_notes": str(parsed.get("clinical_notes") or "").strip(),
        }


# ── Prompt rendering helpers ─────────────────────────────────────────────────


def _render_patient(patient: dict) -> str:
    age = patient.get("age_years")
    rows = [
        f"  Species: {patient.get('species_display') or patient.get('species') or 'unspecified'}",
        f"  Breed: {patient.get('breed') or 'not recorded'}",
        f"  Age: {age if age is not None else 'not recorded'}"
        + (" years" if age is not None else ""),
        f"  Sex: {patient.get('sex') or 'unknown'}",
        f"  Neuter status: {patient.get('neuter_status') or 'unknown'}",
    ]
    return "\n".join(rows)


def _render_results(evaluation: dict) -> str:
    lines = []
    current_series = None
    for entry in evaluation.get("results", []):
        if entry["series"] != current_series:
            current_series = entry["series"]
            lines.append(f"  {SERIES_LABELS[current_series]}:")
        lines.append(
            f"    {entry['label']}: {entry['value_label']} {entry['unit']} "
            f"(reference {entry['reference_label']}) — {entry['status'].upper()}"
        )
    return "\n".join(lines) or "  No values submitted."


def _species_keys() -> str:
    """The selectable species keys, for the transcription prompt."""
    return ", ".join(f'"{key}"' for key in SUPPORTED_SPECIES)


def _render_caveat(evaluation: dict) -> str:
    """Species-specific haematology caveat, when the species has one."""
    caveat = evaluation.get("caveat") or ""
    if not caveat:
        return ""
    return f"Species note: {caveat}\n\n"


def _render_flags(evaluation: dict) -> str:
    flags = evaluation.get("flags", [])
    if not flags:
        return "  None — every submitted parameter is within its reference interval."
    return "\n".join(
        f"  {entry['label']} is {entry['status'].upper()} "
        f"(reference {entry['reference_label']})"
        for entry in flags
    )


# ── Parsing helpers ──────────────────────────────────────────────────────────

_VALID_SPECIES = set(dict(SPECIES_CHOICES))
_VALID_SEX = {"male", "female", "unknown"}
_VALID_NEUTER = {"intact", "neutered", "spayed", "unknown"}
_VALID_QUALITY = {"hemolyzed", "lipemic", "clotted"}


def _coerce_number(raw) -> float | None:
    """Accept ints, floats, and the numeric strings a model sometimes emits."""
    if raw is None or isinstance(raw, bool):
        return None
    if isinstance(raw, (int, float)):
        value = float(raw)
    elif isinstance(raw, str):
        cleaned = raw.strip().replace(",", "").replace("<", "").replace(">", "")
        if not cleaned:
            return None
        try:
            value = float(cleaned)
        except ValueError:
            return None
    else:
        return None

    # A negative or non-finite haematology value is a transcription error, not a
    # result worth flagging.
    if value != value or value in (float("inf"), float("-inf")) or value < 0:
        return None
    return value


def _clean_extraction(parsed) -> dict:
    if not isinstance(parsed, dict):
        raise ValueError("The AI returned an unexpected extraction payload.")

    raw_values = parsed.get("values")
    values: dict[str, float] = {}
    if isinstance(raw_values, dict):
        for key in ANALYTE_KEYS:
            value = _coerce_number(raw_values.get(key))
            if value is not None:
                values[key] = value

    raw_patient = parsed.get("patient")
    patient: dict = {}
    if isinstance(raw_patient, dict):
        species = str(raw_patient.get("species") or "").strip().lower()
        sex = str(raw_patient.get("sex") or "").strip().lower()
        neuter = str(raw_patient.get("neuter_status") or "").strip().lower()
        patient = {
            "pet_name": str(raw_patient.get("pet_name") or "").strip()[:120],
            "owner_name": str(raw_patient.get("owner_name") or "").strip()[:120],
            "species": species if species in _VALID_SPECIES else "",
            "species_label": str(raw_patient.get("species_label") or "").strip()[:60],
            "breed": str(raw_patient.get("breed") or "").strip()[:120],
            "age_years": _coerce_number(raw_patient.get("age_years")),
            "sex": sex if sex in _VALID_SEX else "",
            "neuter_status": neuter if neuter in _VALID_NEUTER else "",
        }

    raw_quality = parsed.get("sample_quality")
    sample_quality = (
        [
            flag
            for flag in (str(item).strip().lower() for item in raw_quality)
            if flag in _VALID_QUALITY
        ]
        if isinstance(raw_quality, list)
        else []
    )

    return {
        "values": values,
        "patient": patient,
        "sample_quality": sorted(set(sample_quality)),
        "smear_morphology": str(parsed.get("smear_morphology") or "").strip(),
        "is_cbc_report": bool(parsed.get("is_cbc_report", True)),
        "is_human_report": bool(parsed.get("is_human_report", False)),
        "unreadable_reason": str(parsed.get("unreadable_reason") or "").strip(),
    }


def _safe_json_loads(raw_text):
    """Parse model output, tolerating a ```json fenced block."""
    if not isinstance(raw_text, str):
        raw_text = str(raw_text)
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if len(lines) >= 2:
                if lines[-1].strip().startswith("```"):
                    lines = lines[:-1]
                cleaned = "\n".join(lines[1:]).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise ValueError("The AI returned invalid JSON.") from exc
