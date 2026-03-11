import type { DiseaseClassificationResult } from "../types"

const DEFAULT_BASE_URL = "http://localhost:8000"

export async function classifyDiseaseImage(
  imageFile: File
): Promise<DiseaseClassificationResult> {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
  const formData = new FormData()
  formData.append("image", imageFile)

  const response = await fetch(`${baseUrl}/api/disease-classify/`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message =
      typeof errorPayload?.detail === "string"
        ? errorPayload.detail
        : "Classification failed. Please try again."
    throw new Error(message)
  }

  const payload = (await response.json()) as DiseaseClassificationResult
  return payload
}
