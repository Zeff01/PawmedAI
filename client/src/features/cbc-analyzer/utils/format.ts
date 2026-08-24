import { NEUTER_OPTIONS, SEX_OPTIONS } from '../constants'
import type { NeuterStatus, Sex } from '../types'

export function formatAge(age: number | string | null | undefined): string {
  if (age === null || age === undefined || age === '') return '—'
  const years = typeof age === 'number' ? age : Number(age)
  if (!Number.isFinite(years) || years < 0) return '—'
  if (years === 0) return 'Newborn'
  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12))
    return `${months} mo`
  }
  const rounded = Number.isInteger(years) ? years : Math.round(years * 10) / 10
  return `${rounded} yo`
}

export function formatAgeLong(age: number | string | null | undefined): string {
  if (age === null || age === undefined || age === '') return 'Not recorded'
  const years = typeof age === 'number' ? age : Number(age)
  if (!Number.isFinite(years) || years < 0) return 'Not recorded'
  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12))
    return `${months} ${months === 1 ? 'Month' : 'Months'}`
  }
  const rounded = Number.isInteger(years) ? years : Math.round(years * 10) / 10
  return `${rounded} ${rounded === 1 ? 'Year' : 'Years'}`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function labelForSex(sex: Sex | null | undefined): string {
  return (
    SEX_OPTIONS.find((option) => option.value === sex)?.label ?? 'Not recorded'
  )
}

function labelForNeuterStatus(status: NeuterStatus | null | undefined): string {
  return (
    NEUTER_OPTIONS.find((option) => option.value === status)?.label ??
    'Not recorded'
  )
}

export function describeSexAndStatus(
  sex: Sex | null | undefined,
  status: NeuterStatus | null | undefined,
): string {
  const hasSex = sex && sex !== 'unknown'
  const hasStatus = status && status !== 'unknown'
  if (!hasSex && !hasStatus) return 'Not recorded'
  if (!hasSex) return labelForNeuterStatus(status)
  if (!hasStatus) return labelForSex(sex)
  if (status === 'spayed' || status === 'neutered') {
    return labelForNeuterStatus(status)
  }
  return `${labelForSex(sex)}, ${labelForNeuterStatus(status)}`
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
}
