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
  const accessToken = data.session?.access_token
  if (!accessToken) {
    // The endpoint refuses this anyway; failing here keeps a photo off the
    // wire when we already know it will be turned away.
    const err = new Error(
      'Sign in to identify a breed — each identification comes out of your account allowance.',
    ) as Error & { code?: string }
    err.code = 'UNAUTHENTICATED'
    throw err
  }
  const headers: HeadersInit = { Authorization: `Bearer ${accessToken}` }

  const response = await fetch(`${baseUrl}/api/breed-classify/`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    let message: string
    if (response.status === 429) {
      message =
        'You have reached the classification limit. Please try again after 5 hours.'
    } else if (response.status === 401 || response.status === 403) {
      message =
        'Your session has expired. Please sign in again to identify a breed.'
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

    const err = new Error(message) as Error & { code?: string }
    if (response.status === 429) {
      err.code = 'THROTTLE'
    }
    if (response.status === 401 || response.status === 403) {
      err.code = 'UNAUTHENTICATED'
    }
    throw err
  }

  return (await response.json()) as BreedClassificationResult
}
