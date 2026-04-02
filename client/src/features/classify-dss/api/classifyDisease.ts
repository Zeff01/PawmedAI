import type { DiseaseClassificationResult } from '../types'
import type { UserType } from '@/stores/userTypeStore'
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
  const isAuthed = Boolean(data.session?.access_token)
  const headers: HeadersInit = {}
  if (data.session?.access_token) {
    headers['Authorization'] = `Bearer ${data.session.access_token}`
  }

  const response = await fetch(`${baseUrl}/api/disease-classify/`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message =
      response.status === 429
        ? isAuthed
          ? 'You have reached the 5 classification limit. You may try again after 5 hours.'
          : 'You have reached the 2 classification limit. You may try again after 10 hours or you may try to login for 5 free classifications.'
        : typeof errorPayload?.detail === 'string'
          ? errorPayload.detail
          : 'Classification failed. Please try again.'
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

  const payload = (await response.json()) as DiseaseClassificationResult
  return payload
}
