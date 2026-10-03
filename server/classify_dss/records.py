"""Saving what the AI answered, for both disease and breed runs."""

import logging

from classify_dss.models import ClassificationRecord
from config.pysecrets import GEMINI_MODEL

logger = logging.getLogger(__name__)


def record_classification(
    *,
    kind: str,
    mode: str,
    outcome: str,
    prompt_version: str,
    had_image: bool,
    had_notes: bool,
    diagnosis: str = "",
    animal_type: str = "",
    confidence=None,
):
    """Save the answer so feedback has something to attach to.

    Never allowed to fail the run it describes: a user who got an answer should
    see it even if the record could not be written, so this returns None then.
    """
    try:
        return ClassificationRecord.objects.create(
            kind=kind,
            mode=mode or "",
            had_image=had_image,
            had_notes=had_notes,
            model_name=GEMINI_MODEL or "",
            prompt_version=prompt_version,
            outcome=outcome,
            animal_type=str(animal_type or "")[:60],
            diagnosis=str(diagnosis or "")[:240],
            confidence=(
                max(0, min(100, int(confidence)))
                if isinstance(confidence, (int, float))
                else None
            ),
        )
    except Exception:
        logger.exception("Could not save the classification record.")
        return None
