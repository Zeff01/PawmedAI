import type { DiseaseClassificationResult } from '../types'
import type { UserType } from '@/types/auth'
import { supabase } from '@/lib/supabase'

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

  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) {
    // The endpoint refuses this anyway; failing here keeps the image off the
    // wire when we already know it will be turned away.
    const err = new Error(
      'Sign in to classify — each classification comes out of your account allowance.',
    ) as Error & { code?: string }
    err.code = 'UNAUTHENTICATED'
    throw err
  }
  const headers: HeadersInit = { Authorization: `Bearer ${accessToken}` }

  const response = await fetch(`${baseUrl}/api/disease-classify/`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    let message: string
    if (response.status === 429) {
      message =
        'You have reached the 5 classification limit. You may try again after 5 hours.'
    } else if (response.status === 401 || response.status === 403) {
      message = 'Your session has expired. Please sign in again to classify.'
    } else if (typeof errorPayload?.detail === 'string') {
      message = errorPayload.detail
    } else {
      message = 'Classification failed. Please try again.'
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

  const payload = (await response.json()) as DiseaseClassificationResult
  return payload
}
