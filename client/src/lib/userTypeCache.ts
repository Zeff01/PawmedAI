import type { UserType } from '@/types/auth'

/**
 * The last known user type, remembered across reloads.
 *
 * `useMe()` needs a network round trip, so on a refresh the app would otherwise
 * spend that time rendering the anonymous layout — the marketing header and
 * landing page — before flipping to the professional workspace. Reading the
 * previous answer synchronously lets the first paint be the right one.
 *
 * This is a rendering hint, never an authorisation signal: the server still
 * gates every professional endpoint, and the value is dropped as soon as
 * `useMe()` contradicts it or the session ends. Supabase keeps its session in
 * localStorage too, so a browser that has lost this key has lost the session
 * with it — "no remembered type" and "signed out" stay in agreement.
 */

const STORAGE_KEY = 'pawmed.user_type'
const USER_TYPES: Array<UserType> = ['student', 'professional', 'fur_parent']

function readStorage(): UserType | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return USER_TYPES.includes(raw as UserType) ? (raw as UserType) : null
  } catch {
    // Private mode, or storage disabled — fall back to in-memory only.
    return null
  }
}

let current: UserType | null = readStorage()
const listeners = new Set<() => void>()

export function subscribeUserType(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getRememberedUserType(): UserType | null {
  return current
}

export function rememberUserType(next: UserType | null) {
  if (next === current) return
  current = next

  try {
    if (next) localStorage.setItem(STORAGE_KEY, next)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore: the in-memory value still keeps this tab consistent.
  }

  listeners.forEach((listener) => listener())
}

export function forgetUserType() {
  rememberUserType(null)
}
