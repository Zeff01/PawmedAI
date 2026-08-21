import base64
import json

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from config.pysecrets import GAPI_KEY, GEMINI_MODEL

if not GAPI_KEY:
    raise ValueError("Gemini API key not found.")

_llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL, temperature=0.2, api_key=GAPI_KEY, thinking_budget=4000
)

BREED_SCHEMA = """
{
  "animal_type": string,
  "breed_name": string,
  "confidence": integer (0-100),
  "description": string,
  "origin": string,
  "size": "small" | "medium" | "large" | "extra-large",
  "temperament": [string],
  "common_traits": [string],
  "care_tips": [string],
  "fun_fact": string,
  "not_identified": boolean
}"""

_FIELD_RULES = (
    "Field rules:\n"
    '- "animal_type": the common species name (e.g. "dog", "cat", "rabbit", "bird"). '
    "Empty string if no animal can be determined.\n"
    '- "breed_name": the specific breed name (e.g. "Golden Retriever", "Siamese", '
    '"Holland Lop"). If the breed cannot be determined, use "Mixed Breed" or the most '
    "likely dominant breed.\n"
    '- "confidence": integer 0-100 representing how confident you are in the breed '
    "identification.\n"
    '- "description": 2-3 sentences describing this breed in plain, friendly language.\n'
    '- "origin": the country or region where this breed originated (e.g. "Scotland, UK", '
    '"Japan").\n'
    '- "size": the typical adult size category for this breed.\n'
    '- "temperament": 3-6 short personality traits (e.g. ["friendly", "intelligent", '
    '"energetic"]).\n'
    '- "common_traits": 3-5 notable physical or behavioral characteristics specific to '
    "this breed.\n"
    '- "care_tips": 3-5 short, practical tips for caring for this breed (grooming, '
    "exercise, diet).\n"
    '- "fun_fact": one interesting or surprising fact about this breed.\n'
)

_CLOSING = (
    "If it is a mixed breed or the exact breed is unclear, still attempt your best "
    "identification and reflect uncertainty in the confidence score. "
    "Never leave breed_name empty — always provide your best guess."
)


def build_breed_prompt(text_input: str = "", has_image: bool = True) -> str:
    """Build the breed prompt for a photo, a written description, or both."""
    cleaned = (text_input or "").strip()

    if has_image and cleaned:
        intro = (
            "You are an expert animal breed identifier. Identify the breed of the animal "
            "using BOTH the photo and the owner's description below. Treat the photo as the "
            "primary evidence, and use the description to settle what a single image cannot "
            "show — adult size, coat texture, behaviour, or known parentage.\n\n"
            f"The owner describes their pet as:\n{cleaned}\n\n"
        )
        not_identified = (
            '- "not_identified": set to true ONLY when the photo shows no real animal and '
            "the description does not describe one either. Otherwise false.\n\n"
        )
    elif has_image:
        intro = (
            "You are an expert animal breed identifier. Analyze the photo and identify the "
            "breed of the animal shown.\n\n"
        )
        not_identified = (
            '- "not_identified": set to true ONLY when the image does not show a real animal, '
            "is too blurry to identify, or shows multiple different species making "
            "identification impossible. Otherwise false.\n\n"
        )
    else:
        intro = (
            "You are an expert animal breed identifier. No photo was provided — identify the "
            "most likely breed from the owner's written description alone.\n\n"
            f"The owner describes their pet as:\n{cleaned}\n\n"
            "Because you cannot see the animal, stay conservative: keep \"confidence\" well "
            "below what you would give for a clear photo (rarely above 70), and state plainly "
            'in "description" that this is based on the described characteristics rather than '
            "a picture. Do not invent details the owner did not mention.\n\n"
        )
        not_identified = (
            '- "not_identified": set to true ONLY when the description does not describe a '
            "real animal, or is far too vague to point at any breed at all. Otherwise false.\n\n"
        )

    return (
        f"{intro}"
        f"Respond ONLY with valid JSON using this schema:\n{BREED_SCHEMA}\n\n"
        f"{_FIELD_RULES}"
        f"{not_identified}"
        f"{_CLOSING}"
    )


class BreedClassifier:
    def __init__(self, model_name=None):
        if model_name:
            self.model = ChatGoogleGenerativeAI(
                model=model_name, temperature=0.2, api_key=GAPI_KEY
            )
        else:
            self.model = _llm

    def classify(self, image_file=None, text_input=None):
        cleaned_text = (text_input or "").strip()
        has_image = image_file is not None
        if not has_image and not cleaned_text:
            raise ValueError(
                "Provide a photo or a description of your pet to identify the breed."
            )

        prompt = build_breed_prompt(text_input=cleaned_text, has_image=has_image)
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
