import type { BreedClassificationResult } from '../types'
import { supabase } from '@/lib/supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

export type BreedClassifyPayload = {
  imageFile: File
}

export async function classifyBreed(
  payload: BreedClassifyPayload,
): Promise<BreedClassificationResult> {
  const { imageFile } = payload
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL

  const formData = new FormData()
  formData.append('image', imageFile)

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
    const message =
      response.status === 429
        ? isAuthed
          ? 'You have reached the classification limit. Please try again after 5 hours.'
          : 'You have reached the classification limit. Sign in to get more free classifications.'
        : typeof errorPayload?.detail === 'string'
          ? errorPayload.detail
          : 'Breed classification failed. Please try again.'
    const err = new Error(message) as Error & {
      code?: string
      isAuthed?: boolean
    }
    if (response.status === 429) {
      err.code = 'THROTTLE'
      err.isAuthed = isAuthed
    }
    throw err
  }

  return (await response.json()) as BreedClassificationResult
}
