import {
  Activity,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CloudCheck,
  Pill as PillIcon,
  Syringe,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { ICON_TONES, TEXT_TONES } from './care-tones'
import { Pill } from './primitives'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CarePriority, PetCareSummary } from '../care-priorities'

const PRIORITY_ICONS: Record<
  CarePriority['icon'],
  ComponentType<{ className?: string }>
> = {
  syringe: Syringe,
  pill: PillIcon,
  calendar: CalendarDays,
  activity: Activity,
}

const TONE_LABELS: Record<CarePriority['tone'], string> = {
  secondary: 'Act soon',
  tertiary: 'Coming up',
  neutral: 'Booked',
  primary: 'Done',
}

const PANEL =
  'rounded-b-xl border border-t-0 border-fp-border bg-fp-subtle p-4 shadow-fp-subtle'

const HEADER_GLYPH: Record<'settled' | 'coming' | 'urgent', string> = {
  settled: 'bg-emerald-100 text-emerald-700',
  coming: 'bg-amber-100 text-amber-700',
  urgent: 'bg-rose-100 text-rose-700',
}

export function AttentionPanel({
  summaries,
  activePetId,
  onSelectPet,
}: {
  summaries: Array<PetCareSummary>
  activePetId: string
  onSelectPet: (petId: string) => void
}) {
  const outstanding = summaries.filter((summary) => summary.top !== null)

  if (outstanding.length === 0) {
    return (
      <section
        aria-label="Care status"
        className={cn('flex items-center justify-between gap-4', PANEL)}
      >
        <div className="flex items-center gap-3.5">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              HEADER_GLYPH.settled,
            )}
          >
            <CircleCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Everyone is up to date
            </h2>
            <p className="text-xs text-slate-600">
              Nothing needs your immediate attention today — medications,
              booster vaccines, and reminders will appear here first.
            </p>
          </div>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 sm:inline-flex">
          <CloudCheck className="size-3.5" />
          Synced with your records
        </span>
      </section>
    )
  }

  const urgent = outstanding.some(
    (summary) => summary.top?.tone === 'secondary',
  )
  const total = outstanding.reduce(
    (count, summary) => count + 1 + summary.extra,
    0,
  )

  return (
    <section aria-label="Care status" className={PANEL}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3.5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {urgent ? 'Needs you soon' : 'Coming up'}
            </h2>
            <p className="text-xs text-slate-600">
              {urgent
                ? 'Something has passed its date — the row below opens that pet’s record.'
                : 'Nothing is late. These are the next dates to keep an eye on.'}
            </p>
          </div>
        </div>
        <Pill tone={urgent ? 'secondary' : 'neutral'}>
          {total} {total === 1 ? 'reminder' : 'reminders'}
        </Pill>
      </header>

      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {summaries.map((summary) => (
          <li key={summary.petId}>
            <SummaryRow
              summary={summary}
              active={summary.petId === activePetId}
              onSelect={() => onSelectPet(summary.petId)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function SummaryRow({
  summary,
  active,
  onSelect,
}: {
  summary: PetCareSummary
  active: boolean
  onSelect: () => void
}) {
  const { top } = summary
  const Icon = top ? PRIORITY_ICONS[top.icon] : CircleCheck

  return (
    <Button
      variant="ghost"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      title={`Show ${summary.petName}’s health details`}
      className={cn(
        'h-auto w-full items-center justify-start gap-3 rounded-lg border bg-white px-3 py-2.5 text-left whitespace-normal transition',
        active
          ? 'border-fp-brand-200 ring-1 ring-fp-brand-200'
          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg',
          ICON_TONES[top?.tone ?? 'primary'],
        )}
      >
        <Icon className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className="shrink-0 text-xs font-bold text-slate-800">
            {summary.petName}
          </span>
          <span className="truncate text-xs text-slate-600">
            {top ? top.title : 'Up to date'}
          </span>
        </span>
        <span className="block text-[11px] text-slate-500">
          {top ? top.detail : 'Nothing outstanding'}
          {summary.extra > 0 ? ` · ${summary.extra} more` : ''}
        </span>
      </span>

      <span
        className={cn(
          'hidden shrink-0 items-center gap-1 text-[11px] font-semibold sm:flex',
          TEXT_TONES[top?.tone ?? 'primary'],
        )}
      >
        {top ? TONE_LABELS[top.tone] : 'All clear'}
        {active ? null : <ChevronRight className="size-3.5" />}
      </span>
    </Button>
  )
}
