import { supabase } from '@/lib/supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

/** A result the user asked to be reminded to rate, once they know the answer. */
export type FeedbackReminder = {
  /** The classification it is about — also the id feedback is sent to. */
  id: string
  kind: 'disease' | 'breed'
  diagnosis: string
  animal_type: string
  classified_at: string
  remind_at: string
}

async function authedFetch(path: string, init: RequestInit = {}) {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('Sign in to see your reminders.')
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
  })
}

/** Reminders that have come due. */
export async function fetchDueReminders(): Promise<Array<FeedbackReminder>> {
  const response = await authedFetch('/api/feedback-reminders/')
  if (!response.ok) throw new Error('Could not load your reminders.')
  return (await response.json()) as Array<FeedbackReminder>
}

/** One reminder, or null once it has been answered or dismissed. */
export async function fetchReminder(
  id: string,
): Promise<FeedbackReminder | null> {
  const response = await authedFetch(`/api/feedback-reminders/${id}/`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Could not load this result.')
  return (await response.json()) as FeedbackReminder
}

export async function dismissReminder(id: string): Promise<void> {
  const response = await authedFetch(`/api/feedback-reminders/${id}/`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Could not dismiss the reminder.')
}
