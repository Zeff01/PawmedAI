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

    def classify(self, image_file):
        image_bytes = image_file.read()
        if not image_bytes:
            raise ValueError("Uploaded image is empty.")

        content_type = getattr(image_file, "content_type", "image/jpeg")
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        image_data_url = f"data:{content_type};base64,{encoded_image}"

        prompt = (
            "You are a veterinary assistant. Analyze the animal image and identify "
            "the most likely disease. Respond ONLY with valid JSON using this schema:\n"
            "{\n"
            "  \"disease_name\": string,\n"
            "  \"short_description\": string,\n"
            "  \"clinical_diagnosis\": string,\n"
            "  \"possible_causes\": [string],\n"
            "  \"symptoms\": [string],\n"
            "  \"recommended_treatment\": string,\n"
            "  \"confidence\": integer (0-100),\n"
            "  \"additional_notes\": string (optional)\n"
            "}\n"
            "If the disease cannot be determined, provide the best possible guess "
            "and include uncertainties in \"additional_notes\". Provide a "
            "confidence score as an integer from 0 to 100."
        )

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