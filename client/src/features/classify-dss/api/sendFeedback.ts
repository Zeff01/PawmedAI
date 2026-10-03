import { supabase } from '@/lib/supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

export type FeedbackVerdict = 'correct' | 'partly' | 'incorrect' | 'unsure'

export type FeedbackConfirmedBy =
  | 'vet_exam'
  | 'lab_test'
  | 'instructor'
  | 'own_judgement'
  | 'papers'
  | 'records'

export type ClassificationFeedbackPayload = {
  verdict: FeedbackVerdict
  actual_diagnosis?: string
  confirmed_by?: FeedbackConfirmedBy | ''
  /** Keep the photo and notes with the feedback — the user's explicit opt-in. */
  share: boolean
  image_url?: string
  notes?: string
  /** With an "unsure" verdict: remind me once I know. Links the result to me. */
  remind_me?: boolean
}

export async function sendClassificationFeedback(
  feedbackId: string,
  payload: ClassificationFeedbackPayload,
): Promise<void> {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('Sign in to send feedback.')

  // Nothing the user didn't agree to share leaves the browser.
  const body: ClassificationFeedbackPayload = payload.share
    ? payload
    : { ...payload, image_url: undefined, notes: undefined }

  const response = await fetch(
    `${baseUrl}/api/classification-feedback/${feedbackId}/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  if (!response.ok) {
    throw new Error('Could not send your feedback. Please try again.')
  }
}
