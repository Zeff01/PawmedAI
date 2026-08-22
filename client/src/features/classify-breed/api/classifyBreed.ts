import type { BreedClassificationResult } from '../types'
import { supabase } from '@/lib/supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

/** Pull the first human-readable string out of a DRF validation error body. */
function firstValidationMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  }
  return null
}

export type BreedClassifyPayload = {
  imageFile?: File | null
  /** Owner's written description of the pet. Either this or an image is required. */
  textInput?: string
}

export async function classifyBreed(
  payload: BreedClassifyPayload,
): Promise<BreedClassificationResult> {
  const { imageFile, textInput } = payload
  const trimmedText = textInput?.trim() ?? ''
  if (!imageFile && !trimmedText) {
    throw new Error(
      'Upload a photo or describe your pet to identify the breed.',
    )
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

  const { data } = await supabase.auth.getSession()
  const isAuthed = Boolean(data.session?.access_token)
  const headers: HeadersInit = {}
  if (data.session?.access_token) {
    headers['Authorization'] = `Bearer ${data.session.access_token}`
  }

  const response = await fetch(`${baseUrl}/api/breed-classify/`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    let message: string
    if (response.status === 429) {
      message = isAuthed
        ? 'You have reached the classification limit. Please try again after 5 hours.'
        : 'You have reached the classification limit. Sign in to get more free classifications.'
    } else if (typeof errorPayload?.detail === 'string') {
      message = errorPayload.detail
    } else {
      // DRF serializer validation returns {non_field_errors: [...]} or
      // {field: [...]} rather than `detail` — surface those instead of a generic
      // failure, so the "describe your pet in more detail" rule is actionable.
      message =
        firstValidationMessage(errorPayload) ??
        'Breed classification failed. Please try again.'
    }

    const err = new Error(message) as Error & {
      code?: string
      isAuthed?: boolean
    }
    if (response.status === 429) {
      err.code = 'THROTTLE'
      err.isAuthed = isAuthed
    }
    if (errorPayload?.code === 'image_requires_auth') {
      err.code = 'IMAGE_REQUIRES_AUTH'
    }
    throw err
  }

  return (await response.json()) as BreedClassificationResult
}
