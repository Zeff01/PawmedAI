import { supabase } from './supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) {
    return {}
  }
  return { Authorization: `Bearer ${data.session.access_token}` }
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T }> {
  const authHeaders = await buildAuthHeaders()
  const headers = new Headers(options.headers)
  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}/api/user${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message =
      typeof errorPayload?.detail === 'string'
        ? errorPayload.detail
        : 'Request failed. Please try again.'
    throw new Error(message)
  }

  const payload = (await response.json()) as T
  return { data: payload }
}

const apiClient = {
  get: <T>(path: string) => requestJson<T>(path),
  post: <T>(path: string, body: unknown) =>
    requestJson<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export default apiClient
