import type { DiseaseClassificationResult } from '../types'
import type { UserType } from '@/stores/userTypeStore'

const DEFAULT_BASE_URL = 'http://localhost:8000'

export async function classifyDiseaseImage(
  imageFile: File,
  mode: UserType,
): Promise<DiseaseClassificationResult> {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('mode', mode)

  const response = await fetch(`${baseUrl}/api/disease-classify/`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message =
      response.status === 429
        ? 'You have reached the 3 classifications limit for today (Philippine time). Please try again after 10 hours.'
        : typeof errorPayload?.detail === 'string'
          ? errorPayload.detail
          : 'Classification failed. Please try again.'
    throw new Error(message)
  }

  const payload = (await response.json()) as DiseaseClassificationResult
  return payload
}
