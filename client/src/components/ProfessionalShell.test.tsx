// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

window.matchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})

vi.mock('@/hooks/useAuth', () => ({
  useMe: () => ({
    data: {
      id: 1,
      username: 'jdoe',
      email: 'j@example.com',
      first_name: 'Jan',
      last_name: 'Doe',
      user_type: 'professional',
    },
  }),
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
  useSupabaseSession: () => ({ session: { access_token: 'token' } }),
}))

vi.mock('@/hooks/useQuota', () => ({
  useQuota: () => ({
    data: {
      authenticated: true,
      scope: 'ai_run_user',
      limit: 5,
      used: 1,
      remaining: 4,
      window_hours: 5,
      resets_at: '2026-08-27T01:00:00+08:00',
    },
    isError: false,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/cbc-analyzer' }),
}))

const { ProfessionalShell } = await import('./ProfessionalShell')

describe('ProfessionalShell', () => {
  it('renders sidebar navigation and the page title', () => {
    render(
      <ProfessionalShell>
        <p>page body</p>
      </ProfessionalShell>,
    )

    expect(screen.getByText('page body')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'CBC Analyzer' })).toBeTruthy()
    expect(screen.getByText('Medical Log')).toBeTruthy()
    expect(screen.getByText('Classify Disease')).toBeTruthy()
    expect(screen.getByText('Nearby Vets')).toBeTruthy()
    expect(screen.getByText('Jan Doe')).toBeTruthy()
    expect(
      screen.getAllByRole('button', { name: /toggle sidebar/i }).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Sign out')).toBeTruthy()
    expect(screen.getByText('4 of 5 analyses left')).toBeTruthy()
  })
})
