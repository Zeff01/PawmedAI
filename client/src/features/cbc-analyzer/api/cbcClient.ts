import { supabase } from '@/lib/supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'

function baseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
}

export type CbcRequestError = Error & {
  status?: number
  code?: string
  fieldErrors?: Record<string, string>
  looksHuman?: boolean
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
    if (key === 'detail' || key === 'code') continue
    if (typeof value === 'string') errors[key] = value
    else if (Array.isArray(value) && typeof value[0] === 'string') {
      errors[key] = value[0]
    }
  }
  return errors
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function toError(response: Response): Promise<CbcRequestError> {
  const payload = await response.json().catch(() => null)

  let message: string
  if (response.status === 403) {
    message =
      typeof payload?.detail === 'string'
        ? payload.detail
        : 'The CBC Analyzer is available to Veterinary Professional profiles only.'
  } else if (response.status === 429) {
    message =
      'You have reached the analysis limit for this hour. Please try again shortly.'
  } else if (response.status === 404) {
    message = 'That record could not be found.'
  } else if (typeof payload?.detail === 'string') {
    message = payload.detail
  } else {
    message = firstMessage(payload) ?? 'Something went wrong. Please try again.'
  }

  const error = new Error(message) as CbcRequestError
  error.status = response.status
  if (typeof payload?.code === 'string') error.code = payload.code
  if (typeof payload?.looks_human === 'boolean') {
    error.looksHuman = payload.looks_human
  }
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

  const response = await fetch(`${baseUrl()}/api/cbc${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) throw await toError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const cbcClient = {
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

export function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}
