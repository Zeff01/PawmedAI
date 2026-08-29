// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { UserProfile } from '@/types/auth'

type MeResult = { data?: UserProfile; isError: boolean }

const meResult: { current: MeResult } = { current: { isError: false } }

vi.mock('./useAuth', () => ({
  useMe: () => meResult.current,
}))

function professional(): UserProfile {
  return {
    id: 1,
    username: 'jdoe',
    email: 'j@example.com',
    first_name: 'Jan',
    last_name: 'Doe',
    user_type: 'professional',
  }
}

/** Re-imports the module graph so the cache re-reads localStorage at boot. */
async function bootWithRememberedType(remembered: string | null) {
  localStorage.clear()
  if (remembered) localStorage.setItem('pawmed.user_type', remembered)
  vi.resetModules()
  return {
    ...(await import('./useUserType')),
    cache: await import('@/lib/userTypeCache'),
  }
}

describe('useUserType', () => {
  beforeEach(() => {
    meResult.current = { isError: false }
  })

  it('reports the remembered type on the very first render, before useMe resolves', async () => {
    const { useUserType } = await bootWithRememberedType('professional')

    const { result } = renderHook(() => useUserType())

    // This is the assertion the layout flash depended on: no intermediate
    // render where a signed-in professional looks anonymous.
    expect(result.current.isProfessional).toBe(true)
  })

  it('treats a browser with nothing remembered as anonymous, with no wait', async () => {
    const { useUserType } = await bootWithRememberedType(null)

    const { result } = renderHook(() => useUserType())

    expect(result.current.isProfessional).toBe(false)
    expect(result.current.userType).toBe(null)
  })

  it('lets a resolved useMe override a stale remembered type', async () => {
    const { useUserType, cache } = await bootWithRememberedType('professional')

    meResult.current = {
      data: { ...professional(), user_type: 'student' },
      isError: false,
    }
    const { result } = renderHook(() => useUserType())

    expect(result.current.isProfessional).toBe(false)
    expect(cache.getRememberedUserType()).toBe('student')
    expect(localStorage.getItem('pawmed.user_type')).toBe('student')
  })

  it('forgets the remembered type when useMe errors', async () => {
    const { useUserType, cache } = await bootWithRememberedType('professional')

    meResult.current = { isError: true }
    const { result } = renderHook(() => useUserType())

    expect(result.current.isProfessional).toBe(false)
    expect(cache.getRememberedUserType()).toBe(null)
    expect(localStorage.getItem('pawmed.user_type')).toBe(null)
  })

  it('remembers the type once useMe resolves', async () => {
    const { useUserType, cache } = await bootWithRememberedType(null)

    meResult.current = { data: professional(), isError: false }
    const { result } = renderHook(() => useUserType())

    expect(result.current.isProfessional).toBe(true)
    expect(cache.getRememberedUserType()).toBe('professional')
  })
})
