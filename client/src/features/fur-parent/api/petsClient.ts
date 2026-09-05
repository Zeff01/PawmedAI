import { supabase } from '@/lib/supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

function baseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
}

export type PetRequestError = Error & {
  status?: number
  fieldErrors?: Record<string, string>
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function firstMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (typeof value === 'string') return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  }
  return null
}

function collectFieldErrors(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object') return {}
  const errors: Record<string, string> = {}
  for (const [key, value] of Object.entries(
    payload as Record<string, unknown>,
  )) {
    if (key === 'detail') continue
    if (typeof value === 'string') errors[key] = value
    else if (Array.isArray(value) && typeof value[0] === 'string') {
      errors[key] = value[0]
    }
  }
  return errors
}

async function toError(response: Response): Promise<PetRequestError> {
  const payload = await response.json().catch(() => null)

  let message: string
  if (response.status === 401 || response.status === 403) {
    message = 'Please sign in again to see your pets.'
  } else if (response.status === 404) {
    message = 'That record could not be found.'
  } else if (response.status === 413) {
    message = 'That file is too large to upload.'
  } else if (response.status >= 500) {
    message = 'Pawmed could not be reached. Please try again shortly.'
  } else if (typeof payload?.detail === 'string') {
    message = payload.detail
  } else {
    message = firstMessage(payload) ?? 'Something went wrong. Please try again.'
  }

  const error = new Error(message) as PetRequestError
  error.status = response.status
  if (response.status === 400) error.fieldErrors = collectFieldErrors(payload)
  return error
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  Object.entries(await authHeaders()).forEach(([key, value]) => {
    headers.set(key, value)
  })

  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${baseUrl()}/api/pets${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) throw await toError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const petsClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
