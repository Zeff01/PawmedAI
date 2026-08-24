"""
Species-specific CBC reference intervals and the deterministic flagging pass.

Every low/normal/high status the UI renders is decided here in plain Python — the
language model is never asked to invent a reference range, so the same panel
always produces the same flags and any disagreement can be traced to a single
file.  The model only writes the narrative brief on top of these results.

Intervals follow widely published veterinary haematology ranges.  Analysers and
laboratories vary, so a clinic that runs its own validated intervals should
override the tables here rather than the flagging code.

An analyte with no interval for the selected species is reported as
`not_assessed` rather than `normal`: the tool declines to judge what it has no
basis to judge, and such a value never contributes to the overall verdict.
"""

from __future__ import annotations

from dataclasses import dataclass


SERIES_RBC = "rbc_series"
SERIES_WBC = "wbc_series"
SERIES_PLT = "plt_series"

SERIES_LABELS = {
    SERIES_RBC: "Red Blood Cell Series",
    SERIES_WBC: "White Blood Cell Series",
    SERIES_PLT: "Platelet Series",
}


@dataclass(frozen=True)
class Analyte:
    key: str
    label: str
    series: str
    unit: str
    optional: bool = False
    precision: int = 1


PANEL: tuple[Analyte, ...] = (
    Analyte("rbc", "RBC", SERIES_RBC, "10^12/L", precision=2),
    Analyte("hgb", "HGB", SERIES_RBC, "g/dL"),
    Analyte("hct", "HCT / PCV", SERIES_RBC, "%"),
    Analyte("mcv", "MCV", SERIES_RBC, "fL"),
    Analyte("mch", "MCH", SERIES_RBC, "pg"),
    Analyte("mchc", "MCHC", SERIES_RBC, "g/dL"),
    Analyte("rdw", "RDW", SERIES_RBC, "%"),
    Analyte(
        "retic_abs",
        "Reticulocytes (abs)",
        SERIES_RBC,
        "/uL",
        optional=True,
        precision=0,
    ),
    Analyte("retic_pct", "Reticulocytes (%)", SERIES_RBC, "%", optional=True),
    # White blood cell (leukocyte) series
    Analyte("wbc", "WBC (total)", SERIES_WBC, "10^9/L"),
    Analyte("neut_seg_abs", "Neutrophils (seg)", SERIES_WBC, "10^9/L", precision=2),
    Analyte("neut_seg_pct", "Neutrophils (seg) %", SERIES_WBC, "%"),
    Analyte("neut_band_abs", "Neutrophils (band)", SERIES_WBC, "10^9/L", precision=2),
    Analyte("neut_band_pct", "Neutrophils (band) %", SERIES_WBC, "%"),
    Analyte("lymph_abs", "Lymphocytes", SERIES_WBC, "10^9/L", precision=2),
    Analyte("lymph_pct", "Lymphocytes %", SERIES_WBC, "%"),
    Analyte("mono_abs", "Monocytes", SERIES_WBC, "10^9/L", precision=2),
    Analyte("mono_pct", "Monocytes %", SERIES_WBC, "%"),
    Analyte("eos_abs", "Eosinophils", SERIES_WBC, "10^9/L", precision=2),
    Analyte("eos_pct", "Eosinophils %", SERIES_WBC, "%"),
    Analyte("baso_abs", "Basophils", SERIES_WBC, "10^9/L", precision=2),
    Analyte("baso_pct", "Basophils %", SERIES_WBC, "%"),
    # Platelet (thrombocyte) series
    Analyte("plt", "PLT", SERIES_PLT, "10^9/L", precision=0),
    Analyte("mpv", "MPV", SERIES_PLT, "fL"),
)

PANEL_BY_KEY: dict[str, Analyte] = {analyte.key: analyte for analyte in PANEL}
ANALYTE_KEYS: tuple[str, ...] = tuple(analyte.key for analyte in PANEL)
REQUIRED_KEYS: tuple[str, ...] = tuple(
    analyte.key for analyte in PANEL if not analyte.optional
)


# ── Species ──────────────────────────────────────────────────────────────────

SPECIES_CANINE = "canine"
SPECIES_FELINE = "feline"
SPECIES_EQUINE = "equine"
SPECIES_BOVINE = "bovine"
SPECIES_OVINE = "ovine"
SPECIES_CAPRINE = "caprine"
SPECIES_PORCINE = "porcine"
SPECIES_RABBIT = "rabbit"
SPECIES_FERRET = "ferret"
SPECIES_GUINEA_PIG = "guinea_pig"
SPECIES_RAT = "rat"
SPECIES_MOUSE = "mouse"
SPECIES_AVIAN = "avian"
SPECIES_OTHER = "other"

#: Short labels, used in prose and on stored records — "flagged against Canine
#: reference intervals" reads better than "Canine (dog)". The client's picker
#: adds the friendly parenthetical for choosing.
SPECIES_CHOICES = (
    (SPECIES_CANINE, "Canine"),
    (SPECIES_FELINE, "Feline"),
    (SPECIES_EQUINE, "Equine"),
    (SPECIES_BOVINE, "Bovine"),
    (SPECIES_OVINE, "Ovine"),
    (SPECIES_CAPRINE, "Caprine"),
    (SPECIES_PORCINE, "Porcine"),
    (SPECIES_RABBIT, "Rabbit"),
    (SPECIES_FERRET, "Ferret"),
    (SPECIES_GUINEA_PIG, "Guinea pig"),
    (SPECIES_RAT, "Rat"),
    (SPECIES_MOUSE, "Mouse"),
    (SPECIES_AVIAN, "Avian"),
    (SPECIES_OTHER, "Other"),
)

#: Free-text spellings a clinician or the extraction model might supply.
SPECIES_ALIASES = {
    "canine": SPECIES_CANINE,
    "dog": SPECIES_CANINE,
    "puppy": SPECIES_CANINE,
    "feline": SPECIES_FELINE,
    "cat": SPECIES_FELINE,
    "kitten": SPECIES_FELINE,
    "equine": SPECIES_EQUINE,
    "horse": SPECIES_EQUINE,
    "pony": SPECIES_EQUINE,
    "foal": SPECIES_EQUINE,
    "bovine": SPECIES_BOVINE,
    "cattle": SPECIES_BOVINE,
    "cow": SPECIES_BOVINE,
    "calf": SPECIES_BOVINE,
    "ovine": SPECIES_OVINE,
    "sheep": SPECIES_OVINE,
    "lamb": SPECIES_OVINE,
    "caprine": SPECIES_CAPRINE,
    "goat": SPECIES_CAPRINE,
    "porcine": SPECIES_PORCINE,
    "pig": SPECIES_PORCINE,
    "swine": SPECIES_PORCINE,
    "piglet": SPECIES_PORCINE,
    "rabbit": SPECIES_RABBIT,
    "lagomorph": SPECIES_RABBIT,
    "bunny": SPECIES_RABBIT,
    "ferret": SPECIES_FERRET,
    "guinea_pig": SPECIES_GUINEA_PIG,
    "guinea pig": SPECIES_GUINEA_PIG,
    "cavy": SPECIES_GUINEA_PIG,
    "rat": SPECIES_RAT,
    "mouse": SPECIES_MOUSE,
    "murine": SPECIES_MOUSE,
    "avian": SPECIES_AVIAN,
    "bird": SPECIES_AVIAN,
    "parrot": SPECIES_AVIAN,
    "psittacine": SPECIES_AVIAN,
    "budgerigar": SPECIES_AVIAN,
    "cockatiel": SPECIES_AVIAN,
}

SPECIES_CAVEATS = {
    SPECIES_AVIAN: (
        "Avian haematology differs from mammalian: birds have heterophils "
        "rather than neutrophils, and nucleated thrombocytes rather than "
        "platelets. Those rows carry no interval here and are reported as not "
        "assessed. Automated counts are unreliable in birds because nucleated "
        "red cells interfere; a manual count is the reference method."
    ),
    SPECIES_OTHER: (
        "No validated interval exists for this species here, so values are "
        "flagged only when they fall outside every species in the table. "
        "Reptile intervals in particular are species-, season-, and "
        "temperature-dependent and should come from your own laboratory."
    ),
}

Interval = tuple[float | None, float | None]

CANINE_INTERVALS: dict[str, Interval] = {
    "rbc": (5.50, 8.50),
    "hgb": (12.0, 18.0),
    "hct": (37.0, 55.0),
    "mcv": (60.0, 77.0),
    "mch": (19.5, 24.5),
    "mchc": (32.0, 36.0),
    "rdw": (11.0, 15.5),
    "retic_abs": (10000.0, 110000.0),
    "retic_pct": (0.0, 1.5),
    "wbc": (6.0, 17.0),
    "neut_seg_abs": (3.0, 11.5),
    "neut_seg_pct": (60.0, 77.0),
    "neut_band_abs": (None, 0.3),
    "neut_band_pct": (None, 3.0),
    "lymph_abs": (1.0, 4.8),
    "lymph_pct": (12.0, 30.0),
    "mono_abs": (0.15, 1.35),
    "mono_pct": (3.0, 10.0),
    "eos_abs": (0.1, 1.25),
    "eos_pct": (2.0, 10.0),
    "baso_abs": (None, 0.1),
    "baso_pct": (None, 1.0),
    "plt": (200.0, 500.0),
    "mpv": (8.0, 14.0),
}

FELINE_INTERVALS: dict[str, Interval] = {
    "rbc": (5.00, 10.00),
    "hgb": (8.0, 15.0),
    "hct": (24.0, 45.0),
    "mcv": (39.0, 55.0),
    "mch": (13.0, 17.0),
    "mchc": (30.0, 36.0),
    "rdw": (14.0, 18.0),
    "retic_abs": (3000.0, 50000.0),
    "retic_pct": (0.0, 0.6),
    "wbc": (5.5, 19.5),
    "neut_seg_abs": (2.5, 12.5),
    "neut_seg_pct": (35.0, 75.0),
    "neut_band_abs": (None, 0.3),
    "neut_band_pct": (None, 3.0),
    "lymph_abs": (1.5, 7.0),
    "lymph_pct": (20.0, 55.0),
    "mono_abs": (0.0, 0.85),
    "mono_pct": (1.0, 4.0),
    "eos_abs": (0.1, 1.5),
    "eos_pct": (2.0, 12.0),
    "baso_abs": (None, 0.2),
    "baso_pct": (None, 1.0),
    "plt": (300.0, 700.0),
    "mpv": (12.0, 18.0),
}

EQUINE_INTERVALS: dict[str, Interval] = {
    "rbc": (6.50, 12.50),
    "hgb": (11.0, 19.0),
    "hct": (32.0, 53.0),
    "mcv": (37.0, 58.0),
    "mch": (12.3, 19.7),
    "mchc": (31.0, 37.0),
    "wbc": (5.4, 14.3),
    "neut_seg_abs": (2.3, 8.6),
    "neut_seg_pct": (30.0, 65.0),
    "neut_band_abs": (None, 0.3),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (1.5, 7.7),
    "lymph_pct": (25.0, 70.0),
    "mono_abs": (0.0, 1.0),
    "mono_pct": (None, 8.0),
    "eos_abs": (0.0, 1.0),
    "eos_pct": (None, 10.0),
    "baso_abs": (None, 0.29),
    "baso_pct": (None, 2.0),
    "plt": (100.0, 350.0),
    "mpv": (5.0, 8.0),
}

BOVINE_INTERVALS: dict[str, Interval] = {
    "rbc": (5.00, 10.00),
    "hgb": (8.0, 15.0),
    "hct": (24.0, 46.0),
    "mcv": (40.0, 60.0),
    "mch": (11.0, 17.0),
    "mchc": (30.0, 36.0),
    "wbc": (4.0, 12.0),
    "neut_seg_abs": (0.6, 4.0),
    "neut_seg_pct": (15.0, 45.0),
    "neut_band_abs": (None, 0.12),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (2.5, 7.5),
    "lymph_pct": (45.0, 75.0),
    "mono_abs": (0.025, 0.84),
    "mono_pct": (2.0, 7.0),
    "eos_abs": (0.0, 2.4),
    "eos_pct": (None, 20.0),
    "baso_abs": (None, 0.2),
    "baso_pct": (None, 2.0),
    "plt": (100.0, 800.0),
}

OVINE_INTERVALS: dict[str, Interval] = {
    "rbc": (9.00, 15.00),
    "hgb": (9.0, 15.0),
    "hct": (27.0, 45.0),
    "mcv": (28.0, 40.0),
    "mch": (8.0, 12.0),
    "mchc": (31.0, 34.0),
    "wbc": (4.0, 12.0),
    "neut_seg_abs": (0.7, 6.0),
    "neut_seg_pct": (10.0, 50.0),
    "neut_band_abs": (None, 0.12),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (1.6, 9.0),
    "lymph_pct": (40.0, 75.0),
    "mono_abs": (0.0, 0.75),
    "mono_pct": (None, 6.0),
    "eos_abs": (0.0, 1.0),
    "eos_pct": (None, 10.0),
    "baso_abs": (None, 0.3),
    "baso_pct": (None, 3.0),
    "plt": (250.0, 750.0),
}

CAPRINE_INTERVALS: dict[str, Interval] = {
    "rbc": (8.00, 18.00),
    "hgb": (8.0, 12.0),
    "hct": (22.0, 38.0),
    "mcv": (16.0, 25.0),
    "mch": (5.2, 8.0),
    "mchc": (30.0, 36.0),
    "wbc": (4.0, 13.0),
    "neut_seg_abs": (1.2, 7.2),
    "neut_seg_pct": (30.0, 48.0),
    "neut_band_abs": (None, 0.12),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (2.0, 9.0),
    "lymph_pct": (50.0, 70.0),
    "mono_abs": (0.0, 0.55),
    "mono_pct": (None, 4.0),
    "eos_abs": (0.0, 0.65),
    "eos_pct": (1.0, 8.0),
    "baso_abs": (None, 0.12),
    "baso_pct": (None, 1.0),
    "plt": (300.0, 600.0),
}

PORCINE_INTERVALS: dict[str, Interval] = {
    "rbc": (5.00, 8.00),
    "hgb": (10.0, 16.0),
    "hct": (32.0, 50.0),
    "mcv": (50.0, 68.0),
    "mch": (17.0, 24.0),
    "mchc": (30.0, 34.0),
    "wbc": (11.0, 22.0),
    "neut_seg_abs": (3.1, 10.4),
    "neut_seg_pct": (28.0, 47.0),
    "neut_band_abs": (None, 0.5),
    "neut_band_pct": (None, 3.0),
    "lymph_abs": (4.3, 13.6),
    "lymph_pct": (39.0, 62.0),
    "mono_abs": (0.2, 2.2),
    "mono_pct": (2.0, 10.0),
    "eos_abs": (0.1, 2.4),
    "eos_pct": (0.5, 11.0),
    "baso_abs": (None, 0.4),
    "baso_pct": (None, 2.0),
    "plt": (325.0, 715.0),
}

RABBIT_INTERVALS: dict[str, Interval] = {
    "rbc": (4.00, 7.20),
    "hgb": (10.0, 17.4),
    "hct": (33.0, 50.0),
    "mcv": (58.0, 79.0),
    "mch": (17.1, 23.5),
    "mchc": (29.0, 37.0),
    "wbc": (5.2, 12.5),
    "neut_seg_abs": (1.4, 7.8),
    "neut_seg_pct": (20.0, 75.0),
    "neut_band_abs": (None, 0.3),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (1.1, 7.5),
    "lymph_pct": (30.0, 85.0),
    "mono_abs": (0.01, 1.0),
    "mono_pct": (1.0, 4.0),
    "eos_abs": (0.0, 0.5),
    "eos_pct": (None, 4.0),
    "baso_abs": (0.0, 0.6),
    "baso_pct": (2.0, 7.0),
    "plt": (250.0, 650.0),
}

FERRET_INTERVALS: dict[str, Interval] = {
    "rbc": (6.80, 12.20),
    "hgb": (12.0, 18.5),
    "hct": (36.0, 55.0),
    "mcv": (44.0, 56.0),
    "mch": (15.0, 18.0),
    "mchc": (30.0, 35.0),
    "wbc": (2.5, 19.0),
    "neut_seg_abs": (1.1, 8.6),
    "neut_seg_pct": (11.0, 84.0),
    "neut_band_abs": (None, 0.3),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (0.9, 9.0),
    "lymph_pct": (12.0, 54.0),
    "mono_abs": (0.0, 1.0),
    "mono_pct": (None, 9.0),
    "eos_abs": (0.0, 0.8),
    "eos_pct": (None, 7.0),
    "baso_abs": (None, 0.3),
    "baso_pct": (None, 3.0),
    "plt": (297.0, 910.0),
}

GUINEA_PIG_INTERVALS: dict[str, Interval] = {
    "rbc": (4.50, 7.00),
    "hgb": (11.0, 15.0),
    "hct": (37.0, 48.0),
    "mcv": (71.0, 96.0),
    "mch": (23.0, 27.0),
    "mchc": (26.0, 39.0),
    "wbc": (7.0, 18.0),
    "neut_seg_abs": (1.1, 10.0),
    "neut_seg_pct": (28.0, 44.0),
    "neut_band_abs": (None, 0.3),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (2.5, 13.0),
    "lymph_pct": (39.0, 72.0),
    "mono_abs": (0.1, 1.5),
    "mono_pct": (1.0, 10.0),
    "eos_abs": (0.0, 1.0),
    "eos_pct": (None, 5.0),
    "baso_abs": (None, 0.5),
    "baso_pct": (None, 3.0),
    "plt": (250.0, 850.0),
}

RAT_INTERVALS: dict[str, Interval] = {
    "rbc": (7.00, 10.00),
    "hgb": (11.0, 18.0),
    "hct": (36.0, 48.0),
    "mcv": (50.0, 62.0),
    "mch": (16.0, 23.0),
    "mchc": (31.0, 40.0),
    "wbc": (6.0, 17.0),
    "neut_seg_abs": (1.0, 7.0),
    "neut_seg_pct": (9.0, 34.0),
    "neut_band_abs": (None, 0.3),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (4.0, 14.0),
    "lymph_pct": (65.0, 85.0),
    "mono_abs": (0.0, 0.6),
    "mono_pct": (None, 5.0),
    "eos_abs": (0.0, 0.4),
    "eos_pct": (None, 4.0),
    "baso_abs": (None, 0.2),
    "baso_pct": (None, 1.5),
    "plt": (500.0, 1300.0),
}

MOUSE_INTERVALS: dict[str, Interval] = {
    "rbc": (7.00, 12.50),
    "hgb": (10.0, 17.0),
    "hct": (36.0, 49.0),
    "mcv": (45.0, 55.0),
    "mch": (12.0, 17.0),
    "mchc": (28.0, 35.0),
    "wbc": (6.0, 15.0),
    "neut_seg_abs": (0.4, 3.0),
    "neut_seg_pct": (10.0, 40.0),
    "neut_band_abs": (None, 0.2),
    "neut_band_pct": (None, 2.0),
    "lymph_abs": (3.0, 12.0),
    "lymph_pct": (55.0, 90.0),
    "mono_abs": (0.0, 0.6),
    "mono_pct": (None, 4.0),
    "eos_abs": (0.0, 0.5),
    "eos_pct": (None, 4.0),
    "baso_abs": (None, 0.1),
    "baso_pct": (None, 1.0),
    "plt": (900.0, 1600.0),
}

AVIAN_INTERVALS: dict[str, Interval] = {
    "rbc": (2.40, 4.50),
    "hgb": (11.0, 20.0),
    "hct": (37.0, 55.0),
    "mcv": (115.0, 165.0),
    "mch": (35.0, 55.0),
    "mchc": (25.0, 35.0),
    "wbc": (5.0, 15.0),
    "lymph_abs": (1.0, 9.0),
    "lymph_pct": (20.0, 67.0),
    "mono_abs": (0.0, 0.5),
    "mono_pct": (None, 3.0),
    "eos_abs": (0.0, 0.3),
    "eos_pct": (None, 2.0),
    "baso_abs": (0.0, 0.7),
    "baso_pct": (None, 5.0),
}

#: Every species with its own validated table.
_SPECIES_TABLES: dict[str, dict[str, Interval]] = {
    SPECIES_CANINE: CANINE_INTERVALS,
    SPECIES_FELINE: FELINE_INTERVALS,
    SPECIES_EQUINE: EQUINE_INTERVALS,
    SPECIES_BOVINE: BOVINE_INTERVALS,
    SPECIES_OVINE: OVINE_INTERVALS,
    SPECIES_CAPRINE: CAPRINE_INTERVALS,
    SPECIES_PORCINE: PORCINE_INTERVALS,
    SPECIES_RABBIT: RABBIT_INTERVALS,
    SPECIES_FERRET: FERRET_INTERVALS,
    SPECIES_GUINEA_PIG: GUINEA_PIG_INTERVALS,
    SPECIES_RAT: RAT_INTERVALS,
    SPECIES_MOUSE: MOUSE_INTERVALS,
    SPECIES_AVIAN: AVIAN_INTERVALS,
}


def _union_of_tables() -> dict[str, Interval]:
    """
    Widest interval across every species in the table.

    Used for `other`, and deliberately permissive: a value is only flagged when
    it falls outside every species we know about. A false "abnormal" on an
    unsupported species is worse than a miss, because it invents a finding the
    clinician then has to disprove.
    """
    union: dict[str, Interval] = {}
    for table in _SPECIES_TABLES.values():
        for key, (low, high) in table.items():
            if key not in union:
                union[key] = (low, high)
                continue
            current_low, current_high = union[key]
            union[key] = (
                None if current_low is None or low is None else min(current_low, low),
                None
                if current_high is None or high is None
                else max(current_high, high),
            )
    return union


OTHER_INTERVALS: dict[str, Interval] = _union_of_tables()

_INTERVALS_BY_SPECIES: dict[str, dict[str, Interval]] = {
    **_SPECIES_TABLES,
    SPECIES_OTHER: OTHER_INTERVALS,
}

SUPPORTED_SPECIES: tuple[str, ...] = tuple(_SPECIES_TABLES.keys())


def normalise_species(value: str | None) -> str:
    """Map any species spelling onto one of the interval tables."""
    cleaned = (value or "").strip().lower().replace("-", "_")
    return SPECIES_ALIASES.get(cleaned, SPECIES_OTHER)


def intervals_for(species: str | None) -> dict[str, Interval]:
    return _INTERVALS_BY_SPECIES[normalise_species(species)]


def caveat_for(species: str | None) -> str:
    """A note about how this species departs from the mammalian panel."""
    return SPECIES_CAVEATS.get(normalise_species(species), "")


# ── Flagging ─────────────────────────────────────────────────────────────────

STATUS_LOW = "low"
STATUS_NORMAL = "normal"
STATUS_HIGH = "high"
STATUS_NOT_ASSESSED = "not_assessed"

OVERALL_NORMAL = "normal"
OVERALL_LOW = "low"
OVERALL_HIGH = "high"
OVERALL_ABNORMAL = "abnormal"

RESULT_STATUS_CHOICES = (
    (OVERALL_NORMAL, "Normal"),
    (OVERALL_LOW, "Low"),
    (OVERALL_HIGH, "High"),
    (OVERALL_ABNORMAL, "Abnormal"),
)


def _format_number(value: float, precision: int) -> str:
    if precision == 0:
        return f"{value:,.0f}"
    return f"{value:.{precision}f}"


def format_interval(analyte: Analyte, low: float | None, high: float | None) -> str:
    """Render an interval the way the results table displays it."""
    if low is None and high is None:
        return "no reference interval"
    if low is None:
        return f"<{_format_number(high, analyte.precision)} {analyte.unit}"
    if high is None:
        return f">{_format_number(low, analyte.precision)} {analyte.unit}"
    return (
        f"{_format_number(low, analyte.precision)}-"
        f"{_format_number(high, analyte.precision)} {analyte.unit}"
    )


def evaluate_panel(values: dict[str, float | None], species: str | None) -> dict:
    """
    Flag every submitted analyte against the interval table for `species`.

    Returns a dict with:
      - `species`: the normalised species the intervals came from
      - `results`: one entry per submitted analyte, in panel order
      - `flags`: the subset that fell outside its interval
      - `not_assessed`: the subset with no interval for this species
      - `result_status`: the single overall verdict for the record list
      - `provided_count` / `missing_required`: completeness of the submission
      - `caveat`: how this species departs from the mammalian panel, if at all
    """
    table = intervals_for(species)
    results: list[dict] = []
    flags: list[dict] = []
    not_assessed: list[dict] = []

    for analyte in PANEL:
        raw = values.get(analyte.key)
        if raw is None:
            continue

        value = float(raw)
        low, high = table.get(analyte.key, (None, None))

        if low is None and high is None:
            # Nothing to compare against, so decline to judge rather than
            # reporting a green "normal" the table cannot support.
            status = STATUS_NOT_ASSESSED
        elif low is not None and value < low:
            status = STATUS_LOW
        elif high is not None and value > high:
            status = STATUS_HIGH
        else:
            status = STATUS_NORMAL

        entry = {
            "key": analyte.key,
            "label": analyte.label,
            "series": analyte.series,
            "unit": analyte.unit,
            "value": value,
            "value_label": _format_number(value, analyte.precision),
            "reference_low": low,
            "reference_high": high,
            "reference_label": format_interval(analyte, low, high),
            "status": status,
        }
        results.append(entry)
        if status in (STATUS_LOW, STATUS_HIGH):
            flags.append(entry)
        elif status == STATUS_NOT_ASSESSED:
            not_assessed.append(entry)

    highs = any(entry["status"] == STATUS_HIGH for entry in flags)
    lows = any(entry["status"] == STATUS_LOW for entry in flags)
    if not flags:
        result_status = OVERALL_NORMAL
    elif highs and lows:
        result_status = OVERALL_ABNORMAL
    elif highs:
        result_status = OVERALL_HIGH
    else:
        result_status = OVERALL_LOW

    provided = {entry["key"] for entry in results}
    return {
        "species": normalise_species(species),
        "results": results,
        "flags": flags,
        "not_assessed": not_assessed,
        "result_status": result_status,
        "provided_count": len(results),
        "missing_required": [key for key in REQUIRED_KEYS if key not in provided],
        "caveat": caveat_for(species),
    }


def describe_flags(flags: list[dict]) -> str:
    """A one-line, human-readable summary of the out-of-range analytes."""
    if not flags:
        return "All submitted parameters within reference limits"
    parts = [
        f"{entry['label']} {entry['status']} "
        f"({entry['value_label']} vs {entry['reference_label']})"
        for entry in flags
    ]
    return "; ".join(parts)
