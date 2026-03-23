import type { DiseaseClassificationResult } from '../types'
import type { UserType } from '@/stores/userTypeStore'

const DEFAULT_BASE_URL = 'http://localhost:8000'

export type DiseaseClassifyPayload = {
  imageFile?: File | null
  textInput?: string
  mode: UserType
}

export async function classifyDisease(
  payloadData: DiseaseClassifyPayload,
): Promise<DiseaseClassificationResult> {
  const { imageFile, textInput, mode } = payloadData
  const trimmedText = textInput?.trim() ?? ''
  if (!imageFile && !trimmedText) {
    throw new Error('Please upload an image or add notes to classify.')
  }
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
  const formData = new FormData()
  if (imageFile) {
    formData.append('image', imageFile)
  }
  if (trimmedText) {
    formData.append('text', trimmedText)
  }
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
