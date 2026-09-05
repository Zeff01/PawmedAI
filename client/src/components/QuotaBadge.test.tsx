// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import type { Quota } from '@/lib/quotas'

const quotaState: { data?: Quota; isError: boolean } = {
  data: undefined,
  isError: false,
}

vi.mock('@/hooks/useQuota', () => ({
  useQuota: () => quotaState,
}))

const sessionState: { session: { access_token: string } | null } = {
  session: { access_token: 'token' },
}

vi.mock('@/hooks/useAuth', () => ({
  useSupabaseSession: () => sessionState,
}))

const { QuotaBadge } = await import('./QuotaBadge')

const quota = (overrides: Partial<Quota> = {}): Quota => ({
  authenticated: true,
  scope: 'ai_run_user',
  limit: 5,
  used: 2,
  remaining: 3,
  window_hours: 5,
  resets_at: '2026-08-27T01:00:00+08:00',
  ...overrides,
})

describe('QuotaBadge', () => {
  afterEach(() => {
    cleanup()
    sessionState.session = { access_token: 'token' }
  })

  it('shows the remaining count once the quota lands', () => {
    quotaState.data = quota()
    quotaState.isError = false

    render(<QuotaBadge />)

    expect(screen.getByText('3 of 5 left')).toBeTruthy()
  })

  it('spells out what it counts when it stands alone', () => {
    quotaState.data = quota()
    quotaState.isError = false

    render(<QuotaBadge withContext />)

    expect(screen.getByText('3 of 5 analyses left')).toBeTruthy()
  })

  it('reports the one shared allowance, whichever feature spent it', () => {
    // A CBC analysis, a breed run, and a disease run all come out of the same
    // five, so three spent leaves two — no per-feature bookkeeping.
    quotaState.data = quota({ used: 3, remaining: 2 })
    quotaState.isError = false

    render(<QuotaBadge withContext />)

    expect(screen.getByText('2 of 5 analyses left')).toBeTruthy()
  })

  it('drops to the singular on the last one', () => {
    quotaState.data = quota({ used: 4, remaining: 1 })
    quotaState.isError = false

    render(<QuotaBadge withContext />)

    expect(screen.getByText('1 of 5 analysis left')).toBeTruthy()
  })

  it('tells a visitor to sign in rather than counting an allowance they lack', () => {
    // Generating requires an account, so there is no anonymous allowance to
    // count down — "0 of 0 left" would read as an exhausted one.
    sessionState.session = null
    quotaState.data = quota({
      authenticated: false,
      scope: 'anonymous',
      limit: 0,
      used: 0,
      remaining: 0,
      window_hours: 0,
      resets_at: null,
    })
    quotaState.isError = false

    render(<QuotaBadge withContext />)

    expect(screen.getByText('Sign in to run an analysis')).toBeTruthy()
  })

  it('does not fall back to a rate a signed-out visitor cannot use', () => {
    sessionState.session = null
    quotaState.data = undefined
    quotaState.isError = true

    render(<QuotaBadge />)

    expect(screen.getByText('Sign in to analyse')).toBeTruthy()
  })

  it('falls back to the plain rate while the count is unknown', () => {
    quotaState.data = undefined
    quotaState.isError = false

    render(<QuotaBadge />)

    // A signed-in user must not be told to sign in mid-load.
    expect(screen.getByText('5 per 5 hrs')).toBeTruthy()
  })

  it('falls back rather than reading as zero when the endpoint fails', () => {
    quotaState.data = undefined
    quotaState.isError = true

    render(<QuotaBadge />)

    expect(screen.getByText('5 per 5 hrs')).toBeTruthy()
  })

  it('marks an exhausted allowance', () => {
    quotaState.data = quota({ used: 5, remaining: 0 })
    quotaState.isError = false

    render(<QuotaBadge />)

    const badge = screen.getByText('0 of 5 left')
    expect(badge.className).toContain('rose')
  })
})
