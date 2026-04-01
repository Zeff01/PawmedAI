import base64
import json

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from config.pysecrets import GAPI_KEY, GEMINI_MODEL

if not GAPI_KEY:
    raise ValueError("Gemini API key not found.")

_llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL, temperature=1, api_key=GAPI_KEY, thinking_budget=8000
)

VALID_MODES = {"student", "professional", "fur_parent"}


class DiseaseClassifier:
    def __init__(self, model_name=None):
        if model_name:
            self.model = ChatGoogleGenerativeAI(
                model=model_name, temperature=0.2, api_key=GAPI_KEY
            )
        else:
            self.model = _llm

    def classify(
        self,
        image_file=None,
        text_input=None,
        mode="professional",
        reference_diagnosis=None,
    ):
        normalized_mode = (mode or "professional").strip().lower()
        if normalized_mode not in VALID_MODES:
            normalized_mode = "professional"

        cleaned_text = (text_input or "").strip()
        has_image = image_file is not None
        if not has_image and not cleaned_text:
            raise ValueError("Provide an image or text notes to classify.")

        prompt = build_prompt(
            mode=normalized_mode,
            text_input=cleaned_text,
            reference_diagnosis=reference_diagnosis,
        )

        content = [{"type": "text", "text": prompt}]
        if has_image:
            image_bytes = image_file.read()
            if not image_bytes:
                raise ValueError("Uploaded image is empty.")

            content_type = getattr(image_file, "content_type", "image/jpeg")
            encoded_image = base64.b64encode(image_bytes).decode("utf-8")
            image_data_url = f"data:{content_type};base64,{encoded_image}"
            content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": image_data_url, "detail": "high"},
                }
            )

        message = HumanMessage(content=content)

        response = self.model.invoke([message])
        return self._safe_json_loads(response.content)

    def is_diagnostic_image(self, image_file=None):
        """
        Triage the uploaded image.

        Returns a tuple of (status, animal_type, reason) where:
          - status: "diagnostic"  — real animal with a visible condition
                    "healthy"     — real animal that appears healthy / no visible issue
                    "not_animal"  — not an animal image
          - animal_type: e.g. "dog", "cat", "horse", or "" when not an animal
          - reason: human-readable explanation string
        """
        if image_file is None:
            return "diagnostic", "", ""

        image_bytes = image_file.read()
        if not image_bytes:
            return "not_animal", "", "Uploaded image is empty."

        content_type = getattr(image_file, "content_type", "image/jpeg")
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        image_data_url = f"data:{content_type};base64,{encoded_image}"

        prompt = (
            "You are a strict image triage checker for a veterinary skin/ear classifier.\n\n"
            "Analyse the image and return ONLY valid JSON with this exact schema:\n"
            "{\n"
            '  "status": "diagnostic" | "healthy" | "not_animal",\n'
            '  "animal_type": string,\n'
            '  "reason": string\n'
            "}\n\n"
            "Rules for each status value:\n"
            '- "diagnostic": A real animal is clearly visible AND there is a visible skin, ear, '
            "wound, or other affected area that can be meaningfully assessed for disease.\n"
            '- "healthy": A real animal is clearly visible but the animal appears healthy with '
            "no visible condition, lesion, wound, or affected area — a routine or portrait photo.\n"
            '- "not_animal": The image does not show a real animal (e.g. poster, illustration, '
            "cartoon, text-only, ad, stock graphic, multiple unidentifiable animals, or no animal "
            "at all).\n\n"
            'For "animal_type": provide the common name of the animal species (e.g. "dog", "cat", '
            '"horse", "rabbit"). Leave as an empty string when status is "not_animal".\n'
            'For "reason": write one short sentence explaining the decision.\n\n'
            "If unsure between diagnostic and healthy, choose healthy.\n"
            'If unsure whether it is an animal at all, choose "not_animal".'
        )

        content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": image_data_url, "detail": "high"}},
        ]
        message = HumanMessage(content=content)
        response = self.model.invoke([message])
        parsed = self._safe_json_loads(response.content)

        status = str(parsed.get("status") or "not_animal").strip().lower()
        if status not in {"diagnostic", "healthy", "not_animal"}:
            status = "not_animal"

        animal_type = str(parsed.get("animal_type") or "").strip().lower()
        reason = str(parsed.get("reason") or "").strip()

        return status, animal_type, reason

    @staticmethod
    def _safe_json_loads(raw_text):
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            cleaned = raw_text.strip()
            if cleaned.startswith("```") and cleaned.endswith("```"):
                cleaned = "\n".join(cleaned.splitlines()[1:-1]).strip()
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError as exc:
                raise ValueError("AI returned invalid JSON.") from exc


def build_prompt(
    mode: str = "professional",
    text_input: str = "",
    reference_diagnosis: str | None = None,
) -> str:
    # ------------------------------------------------------------------
    # animal_type is included in every schema so the field is always
    # present regardless of mode.  The model is instructed to populate
    # it with the common species name (dog, cat, horse …).
    # ------------------------------------------------------------------

    base_schema = """
{
  "animal_type": string,
  "disease_name": string,
  "short_description": string,
  "clinical_diagnosis": string,
  "possible_causes": [string],
  "symptoms": [string],
  "recommended_treatment": string,
  "confidence": integer (0-100),
  "additional_notes": string (optional)
}"""

    student_extra = """
  "differential_diagnoses": [
    {
      "name": string,
      "reason_excluded": string
    }
  ],
  "pathophysiology": string,
  "visual_cues": [string],
  "study_topics": [string]"""

    professional_extra = """
  "treatment_protocol": {
    "medications": [string],
    "dosage_notes": string,
    "duration": string
  },
  "escalation_criteria": [string],
  "differential_diagnoses": [string]"""

    # Fur parent mode uses a completely separate, simpler schema
    fur_parent_schema = """
{
  "animal_type": string,
  "possible_condition_name": string,
  "what_we_noticed": string,
  "what_this_might_mean": string,
  "signs_to_watch_for": [string],
  "how_serious_does_it_look": string,
  "what_you_can_do_right_now": [string],
  "see_a_vet_because": string,
  "urgency": "routine checkup" | "schedule soon (within a few days)" | "go today" | "emergency — go now",
  "reassurance_note": string
}"""

    animal_type_instruction = (
        'For "animal_type": always populate this with the common name of the animal species '
        'visible in the image (e.g. "dog", "cat", "horse", "rabbit", "bird"). '
        'If no animal is visible, set it to an empty string "".\n\n'
    )

    healthy_instruction = (
        "IMPORTANT — HEALTHY ANIMAL RULE:\n"
        "If the animal appears healthy with no visible skin condition, wound, lesion, "
        "or any other abnormality, you MUST:\n"
        '- Set disease_name to "Healthy Animal"\n'
        '- Set clinical_diagnosis to "No visible condition detected"\n'
        "- Set confidence to 0\n"
        "- Set possible_causes and symptoms to empty lists []\n"
        '- Set recommended_treatment to "No treatment required. Schedule a routine '
        'veterinary check-up to maintain good health."\n'
        "- Use short_description to reassure that the animal looks healthy based on what "
        "is visible.\n\n"
    )

    fur_parent_healthy_instruction = (
        "IMPORTANT — HEALTHY ANIMAL RULE:\n"
        "If the animal appears healthy with no visible issue, you MUST:\n"
        '- Set possible_condition_name to "Healthy Animal"\n'
        '- Set urgency to "routine checkup"\n'
        "- Use what_we_noticed and what_this_might_mean to reassure the owner that "
        "the animal looks healthy based on what is visible.\n\n"
    )

    if mode == "fur_parent":
        persona = (
            "You are a warm, caring assistant helping a worried pet owner understand "
            "what might be going on with their animal. You are NOT giving a medical diagnosis. "
            "Your job is to describe what you observe in plain, calm language, "
            "explain what it might mean in simple terms a non-vet can understand, "
            "and guide them toward the right level of veterinary care. "
            "\n\n"
            "CRITICAL SAFETY RULES you must always follow:\n"
            "- Never suggest specific medications, doses, or home treatments that could harm the pet.\n"
            "- Never say anything that could lead the owner to delay necessary vet care.\n"
            "- Never use clinical or medical jargon — speak like a knowledgeable, caring friend.\n"
            "- Never present the result as a definitive diagnosis — always frame it as 'this might be' or 'this could suggest'.\n"
            "- Always end with encouragement to see a vet, no matter how minor it seems.\n"
            "- If something looks potentially life-threatening, make the urgency crystal clear without causing panic.\n"
            "- The 'what_you_can_do_right_now' field should only include safe, supportive actions "
            "  (e.g. keep the pet calm, make sure they have water, prevent scratching) — "
            "  never include anything that could cause harm if done incorrectly."
        )

        extra_context = ""
        if text_input:
            extra_context = f"\n\nWhat the pet owner shared:\n{text_input}\n"
        if reference_diagnosis:
            extra_context += (
                "\n\nMost likely medical diagnosis (use this exact phrase for "
                f"'possible_condition_name'): {reference_diagnosis}\n"
            )

        return (
            f"{persona}\n\n"
            f"Respond ONLY with valid JSON using this schema:\n{fur_parent_schema}\n\n"
            f"{animal_type_instruction}"
            f"{fur_parent_healthy_instruction}"
            "Write everything in simple, friendly, reassuring language. "
            "For 'possible_condition_name', use the medical name of the most likely condition. "
            "If the image does NOT show a real animal or there is no visible affected area, "
            "set 'possible_condition_name' to 'Not an animal' and explain that a clear close-up "
            "photo of a single pet is needed. "
            "Use short sentences. Avoid any words that would require a medical degree to understand. "
            "The 'reassurance_note' should be a short, kind sentence reminding the owner "
            "that noticing something is the right thing to do and that vets are there to help."
            f"{extra_context}"
        )

    if mode == "student":
        schema = base_schema.replace(
            '"additional_notes": string (optional)\n}',
            '"additional_notes": string (optional),'
            + student_extra + '\n}'
        )
        persona = (
            "You are a veterinary education assistant helping a veterinary student "
            "learn through real clinical cases. Analyze the animal image and identify "
            "the most likely disease. Explain your reasoning clearly, include what "
            "visual cues support the diagnosis, list differential diagnoses with reasons "
            "they were excluded, and suggest study topics to help the student learn more."
        )
    else:
        schema = base_schema.replace(
            '"additional_notes": string (optional)\n}',
            '"additional_notes": string (optional),'
            + professional_extra + '\n}'
        )
        persona = (
            "You are a veterinary clinical assistant helping an experienced veterinary "
            "professional. Analyze the animal image and identify the most likely disease. "
            "Be concise and clinically precise. Include specific treatment protocols "
            "with medications and dosages, and flag any escalation criteria."
        )

    extra_context = ""
    if text_input:
        extra_context = f"\n\nClinical notes provided by the user:\n{text_input}\n"
    if reference_diagnosis:
        extra_context += (
            "\n\nMost likely medical diagnosis (use this exact phrase for "
            f"the primary disease name): {reference_diagnosis}\n"
        )

    return (
        f"{persona}\n\n"
        f"Respond ONLY with valid JSON using this schema:\n{schema}\n\n"
        f"{animal_type_instruction}"
        f"{healthy_instruction}"
        "If the image does NOT show a real animal or there is no visible affected area, "
        "set disease_name to 'Not an animal' and explain the issue in short_description. "
        "If the disease cannot be determined, provide the best possible guess "
        "and include uncertainties in \"additional_notes\". "
        "Provide a confidence score as an integer from 0 to 100."
        f"{extra_context}"
    )