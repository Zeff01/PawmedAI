"""Reads the case library off disk.

Cases live as JSON under `academy/cases/`, one file per case — adding a case
means dropping in a new file and re-running `manage.py seed_cases`, with no
Python to edit. A file may also hold a list of cases if you would rather group
several together; the loader accepts either shape.

Everything here is validation. These files are written by hand, so a typo is the
expected failure: a misspelt species, a single-answer stage with two correct
options, a stage missing its explanation. Each check names the file and the
field, because a `NOT NULL constraint failed` three layers down tells the author
nothing about which of their cases is wrong.

Ordering comes from each case's `order`, not from the filename — the numeric
filename prefixes are a convenience for reading the directory, and files are
sorted by `(order, slug)` so two cases can never seed in an arbitrary order.

Field reference (see `models.py` for how each one is used):

    slug              required, ≤80 chars, unique across the library. The URL.
    title             required, ≤200 chars
    species           required, the patient's clinical adjective — one of
                      the 36 terms in `Case.Species` (models.py). Use the
                      most specific term that fits; `avian`, `reptilian`,
                      `rodent`, `wildlife` and `exotic` are the catch-alls.
                      `seed_cases --species` lists them all.
    discipline        required, ≤120 chars, e.g. "Emergency & Critical Care"
    difficulty        required, one of beginner / intermediate / advanced
    body_system       required, ≤120 chars
    presentation      required, the signalment shown on the case card
    completion_bonus  optional, default 25, awarded for a clean run
    order             optional, default 0, position in the library
    is_published      optional, default true
    stages            required, at least one:
        kind          required, one of history / diagnostics /
                      differential / diagnosis
        title         required, ≤160 chars
        briefing      optional, clinical detail released at this stage
        prompt        required, ≤300 chars, the question
        select_mode   optional, default "single", or "multi"
        points        required, what the stage is worth
        explanation   required, the teaching point shown after answering
        options       required, at least two:
            label     required, ≤240 chars
            detail    optional, ≤300 chars
            correct   optional, default false
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from academy.models import Case, CaseStage

CASES_DIR = Path(__file__).resolve().parent / "cases"

SPECIES = set(Case.Species.values)
DIFFICULTIES = set(Case.Difficulty.values)
STAGE_KINDS = set(CaseStage.Kind.values)
SELECT_MODES = set(CaseStage.SelectMode.values)

CASE_KEYS = {
    "slug",
    "title",
    "species",
    "discipline",
    "difficulty",
    "body_system",
    "presentation",
    "completion_bonus",
    "order",
    "is_published",
    "stages",
}
STAGE_KEYS = {
    "kind",
    "title",
    "briefing",
    "prompt",
    "select_mode",
    "points",
    "explanation",
    "options",
}
OPTION_KEYS = {"label", "detail", "correct"}


class CaseLibraryError(Exception):
    """A case file is unusable. The message names the file and the field."""


def load_cases(directory: Path | None = None) -> list[dict[str, Any]]:
    """Every case in the library, validated and ordered.

    Options come back as dicts with an `is_correct` key, ready to hand to
    `CaseOption`, and every optional field is filled in with its default — the
    caller never has to ask whether a key is present.
    """
    directory = Path(directory) if directory else CASES_DIR
    if not directory.is_dir():
        raise CaseLibraryError(f"No case directory at {directory}")

    paths = sorted(
        path
        for path in directory.glob("*.json")
        if not path.name.startswith("_")
    )
    if not paths:
        raise CaseLibraryError(f"No case files (*.json) in {directory}")

    cases: list[dict[str, Any]] = []
    slug_source: dict[str, str] = {}

    for path in paths:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CaseLibraryError(f"{path.name}: invalid JSON — {exc}") from exc

        documents = payload if isinstance(payload, list) else [payload]
        for index, document in enumerate(documents, start=1):
            where = path.name if len(documents) == 1 else f"{path.name} case {index}"
            case = _clean_case(document, where)

            slug = case["slug"]
            if slug in slug_source:
                raise CaseLibraryError(
                    f"{where}: slug '{slug}' is already used by "
                    f"{slug_source[slug]} — slugs must be unique."
                )
            slug_source[slug] = where
            cases.append(case)

    cases.sort(key=lambda case: (case["order"], case["slug"]))
    return cases


# ── Per-document validation ─────────────────────────────────────────────────


def _clean_case(document: Any, where: str) -> dict[str, Any]:
    if not isinstance(document, dict):
        raise CaseLibraryError(f"{where}: expected an object, got {_kind(document)}.")
    _reject_unknown(document, CASE_KEYS, where, "case")

    slug = _text(document, "slug", where, max_length=80)
    if slug != slug.strip() or " " in slug:
        raise CaseLibraryError(
            f"{where}: slug '{slug}' must be a URL slug — no spaces."
        )

    raw_stages = document.get("stages")
    if not isinstance(raw_stages, list) or not raw_stages:
        raise CaseLibraryError(f"{where}: 'stages' must be a non-empty list.")

    return {
        "slug": slug,
        "title": _text(document, "title", where, max_length=200),
        "species": _choice(document, "species", where, SPECIES),
        "discipline": _text(document, "discipline", where, max_length=120),
        "difficulty": _choice(document, "difficulty", where, DIFFICULTIES),
        "body_system": _text(document, "body_system", where, max_length=120),
        "presentation": _text(document, "presentation", where),
        "completion_bonus": _int(document, "completion_bonus", where, default=25),
        "order": _int(document, "order", where, default=0),
        "is_published": _flag(document, "is_published", where, default=True),
        "stages": [
            _clean_stage(stage, f"{where} stage {position}")
            for position, stage in enumerate(raw_stages, start=1)
        ],
    }


def _clean_stage(document: Any, where: str) -> dict[str, Any]:
    if not isinstance(document, dict):
        raise CaseLibraryError(f"{where}: expected an object, got {_kind(document)}.")
    _reject_unknown(document, STAGE_KEYS, where, "stage")

    select_mode = _choice(
        document, "select_mode", where, SELECT_MODES, default=CaseStage.SelectMode.SINGLE
    )

    raw_options = document.get("options")
    if not isinstance(raw_options, list) or len(raw_options) < 2:
        raise CaseLibraryError(
            f"{where}: 'options' must be a list of at least two answers."
        )
    options = [
        _clean_option(option, f"{where} option {position}")
        for position, option in enumerate(raw_options, start=1)
    ]

    correct = [option for option in options if option["is_correct"]]
    if not correct:
        raise CaseLibraryError(
            f"{where}: no option is marked correct — a stage no one can clear "
            "would block the rest of the case."
        )
    if select_mode == CaseStage.SelectMode.SINGLE and len(correct) > 1:
        raise CaseLibraryError(
            f"{where}: select_mode 'single' but {len(correct)} options are "
            "correct — use 'multi', or mark only one."
        )

    return {
        "kind": _choice(document, "kind", where, STAGE_KINDS),
        "title": _text(document, "title", where, max_length=160),
        "briefing": _text(document, "briefing", where, required=False),
        "prompt": _text(document, "prompt", where, max_length=300),
        "select_mode": select_mode,
        "points": _int(document, "points", where, minimum=1),
        "explanation": _text(document, "explanation", where),
        "options": options,
    }


def _clean_option(document: Any, where: str) -> dict[str, Any]:
    if not isinstance(document, dict):
        raise CaseLibraryError(
            f"{where}: expected an object with 'label', 'detail' and 'correct', "
            f"got {_kind(document)}."
        )
    _reject_unknown(document, OPTION_KEYS, where, "option")

    return {
        "label": _text(document, "label", where, max_length=240),
        "detail": _text(document, "detail", where, max_length=300, required=False),
        "is_correct": _flag(document, "correct", where, default=False),
    }


# ── Field readers ───────────────────────────────────────────────────────────


def _text(
    document: dict[str, Any],
    key: str,
    where: str,
    *,
    max_length: int | None = None,
    required: bool = True,
) -> str:
    value = document.get(key, "")
    if not isinstance(value, str):
        raise CaseLibraryError(f"{where}: '{key}' must be text, got {_kind(value)}.")

    value = value.strip()
    if required and not value:
        raise CaseLibraryError(f"{where}: '{key}' is required.")
    if max_length and len(value) > max_length:
        raise CaseLibraryError(
            f"{where}: '{key}' is {len(value)} characters, the column holds "
            f"{max_length}."
        )
    return value


def _choice(
    document: dict[str, Any],
    key: str,
    where: str,
    allowed: set[str],
    *,
    default: str | None = None,
) -> str:
    value = document.get(key, default)
    if value is None:
        raise CaseLibraryError(
            f"{where}: '{key}' is required — one of {_list(allowed)}."
        )
    if value not in allowed:
        raise CaseLibraryError(
            f"{where}: '{key}' is '{value}', expected one of {_list(allowed)}."
        )
    return str(value)


def _int(
    document: dict[str, Any],
    key: str,
    where: str,
    *,
    default: int | None = None,
    minimum: int = 0,
) -> int:
    value = document.get(key, default)
    if value is None:
        raise CaseLibraryError(f"{where}: '{key}' is required.")
    # bool is an int in Python, and "points": true is a mistake, not a 1.
    if isinstance(value, bool) or not isinstance(value, int):
        raise CaseLibraryError(
            f"{where}: '{key}' must be a whole number, got {_kind(value)}."
        )
    if value < minimum:
        raise CaseLibraryError(f"{where}: '{key}' must be {minimum} or more.")
    return value


def _flag(
    document: dict[str, Any], key: str, where: str, *, default: bool
) -> bool:
    value = document.get(key, default)
    if not isinstance(value, bool):
        raise CaseLibraryError(
            f"{where}: '{key}' must be true or false, got {_kind(value)}."
        )
    return value


def _reject_unknown(
    document: dict[str, Any], allowed: set[str], where: str, level: str
) -> None:
    unknown = set(document) - allowed
    if unknown:
        raise CaseLibraryError(
            f"{where}: unknown {level} field(s) {_list(unknown)}. "
            f"Known fields: {_list(allowed)}."
        )


def _list(values: set[str]) -> str:
    return ", ".join(sorted(values))


def _kind(value: Any) -> str:
    if value is None:
        return "null"
    return {
        bool: "true/false",
        int: "a number",
        float: "a number",
        str: "text",
        list: "a list",
        dict: "an object",
    }.get(type(value), type(value).__name__)


__all__ = ["CASES_DIR", "CaseLibraryError", "load_cases"]
