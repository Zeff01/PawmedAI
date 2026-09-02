// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { QUOTA_KEY } from './useQuota'

const signOut = vi.fn(async () => ({ error: null }))

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { signOut: () => signOut() } },
}))

vi.mock('../lib/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(async () => ({ data: { id: 1, user_type: 'professional' } })),
  },
}))

vi.mock('../lib/userTypeCache', () => ({
  forgetUserType: vi.fn(),
  getRememberedUserType: () => null,
  rememberUserType: vi.fn(),
  subscribeUserType: () => () => {},
}))

/** A cache holding the count that belonged to the previous caller. */
function clientWithStaleQuota() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  queryClient.setQueryData(QUOTA_KEY, {
    authenticated: false,
    scope: 'anon',
    limit: 2,
    used: 1,
    remaining: 1,
    window_hours: 5,
    resets_at: null,
  })
  return queryClient
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('the analyses count is scoped to whoever is signed in', () => {
  it('drops the anonymous count when a session is synced', async () => {
    const { useOAuthCallback } = await import('./useAuth')
    const queryClient = clientWithStaleQuota()

    const { result } = renderHook(() => useOAuthCallback(), {
      wrapper: wrapper(queryClient),
    })
    result.current.mutate({ access_token: 'token' })

    // Signing in as a professional must not inherit the visitor's "1 of 2".
    await waitFor(() =>
      expect(queryClient.getQueryState(QUOTA_KEY)?.isInvalidated).toBe(true),
    )
  })

  it('drops the authenticated count on sign-out', async () => {
    const { useLogout } = await import('./useAuth')
    const queryClient = clientWithStaleQuota()

    const { result } = renderHook(() => useLogout(), {
      wrapper: wrapper(queryClient),
    })
    result.current.mutate()

    await waitFor(() =>
      expect(queryClient.getQueryState(QUOTA_KEY)?.isInvalidated).toBe(true),
    )
  })
})
