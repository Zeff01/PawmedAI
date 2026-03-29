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
        if image_file is None:
            return True, ""
        image_bytes = image_file.read()
        if not image_bytes:
            return False, "Uploaded image is empty."

        content_type = getattr(image_file, "content_type", "image/jpeg")
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        image_data_url = f"data:{content_type};base64,{encoded_image}"

        prompt = (
            "You are a strict image triage checker for a veterinary skin/ear classifier. "
            "Return JSON only: {\"is_diagnostic\": true|false, \"reason\": string}.\n\n"
            "Return true only if a real animal patient is clearly visible AND the image is a "
            "usable close-up for diagnosis (skin, ear, wound, or affected body area in focus).\n"
            "Return false for posters, illustrations, cartoons, text-only images, ads, "
            "stock photos with no visible issue, multiple animals without a clear patient, "
            "or images where the affected area is not visible.\n"
            "If unsure, return false."
        )

        content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": image_data_url, "detail": "high"}},
        ]
        message = HumanMessage(content=content)
        response = self.model.invoke([message])
        parsed = self._safe_json_loads(response.content)
        return bool(parsed.get("is_diagnostic")), str(parsed.get("reason") or "")

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
    base_schema = """
{
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

    return (
        f"{persona}\n\n"
        f"Respond ONLY with valid JSON using this schema:\n{schema}\n\n"
        "If the image does NOT show a real animal or there is no visible affected area, "
        "set disease_name to 'Not an animal' and explain the issue in short_description. "
        "If the disease cannot be determined, provide the best possible guess "
        "and include uncertainties in \"additional_notes\". "
        "Provide a confidence score as an integer from 0 to 100."
        f"{extra_context}"
    )
