// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('@/hooks/useAuth', () => ({
  useMe: () => ({ data: { first_name: 'Jan', username: 'jdoe' } }),
}))

vi.mock('@/features/cbc-analyzer/hooks/useCbc', () => ({
  useMedicalLogSummary: () => ({
    data: {
      total: 12,
      normal: 9,
      abnormal: 3,
      normal_change: 20,
      abnormal_change: -25,
      this_month: 5,
      window_days: 30,
    },
    isLoading: false,
  }),
  useMedicalLogs: () => ({
    data: {
      count: 41,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          record_id: 'REC-001',
          pet_id: 7,
          pet_name: 'Biscuit',
          species: 'canine',
          species_display: 'Dog',
          breed: 'Beagle',
          test_type: 'CBC',
          test_date: '2026-08-20',
          key_findings: 'Mild anemia',
          result_status: 'abnormal',
          flag_count: 3,
          created_at: '2026-08-20T10:00:00Z',
        },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePets: () => ({
    data: [
      {
        id: 7,
        name: 'Biscuit',
        species: 'canine',
        species_label: '',
        species_display: 'Dog',
        breed: 'Beagle',
        age_years: '4',
        sex: 'male',
        neuter_status: 'neutered',
        owner_name: 'A. Cruz',
        notes: '',
        log_count: 4,
        created_at: '',
        updated_at: '',
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, params: _params, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

const { DashboardView } = await import('./DashboardView')

describe('DashboardView', () => {
  it('renders the summary stats, recent analyses, and patients', () => {
    render(<DashboardView />)

    // Greeting + all-time count from the paginated response.
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Jan',
    )
    expect(screen.getByText(/41 records on file/)).toBeTruthy()

    // Stat tiles.
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByText('+20%')).toBeTruthy()
    expect(screen.getByText('−25%')).toBeTruthy()

    // Recent analyses row links to the record detail.
    const recent = screen
      .getByRole('heading', { name: 'Recent analyses' })
      .closest('section')!
    const row = within(recent).getByRole('link', { name: /Biscuit/ })
    expect(row.getAttribute('href')).toBe('/medical-log/$recordId')
    expect(within(recent).getByText(/3 flags/)).toBeTruthy()

    // Result mix: 9 normal of 12 is 75%.
    const mix = screen
      .getByRole('heading', { name: 'Result mix' })
      .closest('section')!
    expect(within(mix).getByText('75%')).toBeTruthy()
    expect(within(mix).getByText('25%')).toBeTruthy()

    // Patients.
    const patients = screen
      .getByRole('heading', { name: 'Patients' })
      .closest('section')!
    expect(within(patients).getByText('1 on file')).toBeTruthy()
    expect(within(patients).getByText('4 records')).toBeTruthy()
  })
})
