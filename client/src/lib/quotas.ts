import { supabase } from './supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

/**
 * The caller's remaining analyses for the current window.
 *
 * One allowance covers everything a model generates — CBC analyses, disease
 * classifications, and breed identifications all spend from this same count.
 */
export type Quota = {
  authenticated: boolean
  scope: string
  limit: number
  used: number
  remaining: number
  window_hours: number
  /** ISO timestamp — when the count goes back to zero. */
  resets_at: string | null
}

export async function fetchQuota(): Promise<Quota> {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL

  const { data } = await supabase.auth.getSession()
  const headers: Record<string, string> = {}
  if (data.session?.access_token) {
    headers['Authorization'] = `Bearer ${data.session.access_token}`
  }

  const response = await fetch(`${baseUrl}/api/classify-quota/`, { headers })
  if (!response.ok) {
    throw new Error('Could not read your remaining analyses.')
  }

  return (await response.json()) as Quota
}
