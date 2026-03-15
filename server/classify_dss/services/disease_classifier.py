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


class DiseaseClassifier:
    def __init__(self, model_name=None):
        if model_name:
            self.model = ChatGoogleGenerativeAI(
                model=model_name, temperature=0.2, api_key=GAPI_KEY
            )
        else:
            self.model = _llm 

    def classify(self, image_file, mode="professional"):
        image_bytes = image_file.read()
        if not image_bytes:
            raise ValueError("Uploaded image is empty.")

        content_type = getattr(image_file, "content_type", "image/jpeg")
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        image_data_url = f"data:{content_type};base64,{encoded_image}"

        normalized_mode = (mode or "professional").strip().lower()
        if normalized_mode not in {"student", "professional"}:
            normalized_mode = "professional"
        prompt = build_prompt(mode=normalized_mode)

        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_data_url, "detail": "high"}},
            ]
        )

        response = self.model.invoke([message])
        return self._safe_json_loads(response.content)

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


def build_prompt(mode: str = "professional") -> str:
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

    return (
        f"{persona}\n\n"
        f"Respond ONLY with valid JSON using this schema:\n{schema}\n\n"
        "If the disease cannot be determined, provide the best possible guess "
        "and include uncertainties in \"additional_notes\". "
        "Provide a confidence score as an integer from 0 to 100."
    )
