import * as React from 'react'
import {
  Check,
  CircleAlert,
  Download,
  Info,
  Loader2,
  Plus,
  Syringe,
  TriangleAlert,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { CardAction, CareCard, EmptyState } from './primitives'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { downloadVaccinationRecord } from '../utils/downloads'
import type { CareStatus, VaccinationRecord } from '../types'

type VaccinationState = VaccinationRecord['state']

const STATE_ICONS: Record<
  VaccinationState,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  active: Check,
  upcoming: CircleAlert,
  overdue: TriangleAlert,
}

const STATE_STYLES: Record<
  VaccinationState,
  { node: string; caption: string; label: string }
> = {
  active: {
    node: 'bg-emerald-100 text-emerald-700',
    caption: 'text-emerald-600',
    label: 'Protected',
  },
  upcoming: {
    node: 'bg-amber-100 text-amber-700',
    caption: 'text-amber-600',
    label: 'Renewal suggested',
  },
  overdue: {
    node: 'bg-rose-100 text-rose-700',
    caption: 'text-rose-600',
    label: 'Lapsed — book now',
  },
}

export function VaccinationsCard({
  vaccinations,
  pet,
  syncedLabel,
  onAddVaccination,
  onError,
}: {
  vaccinations: { status: CareStatus; records: Array<VaccinationRecord> }
  pet: { name: string; breed: string; ageLabel: string }
  syncedLabel: string
  onAddVaccination: () => void
  onError: (message: string) => void
}) {
  const { status, records } = vaccinations
  const [saving, setSaving] = React.useState(false)

  const download = async () => {
    setSaving(true)
    try {
      await downloadVaccinationRecord({
        petName: pet.name,
        breed: pet.breed,
        ageLabel: pet.ageLabel,
        syncedLabel,
        statusLabel: status.label,
        records,
      })
    } catch {
      onError('The vaccination record could not be generated')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CareCard
      icon={Syringe}
      iconTone="brand"
      title="Vaccines & boosters"
      subtitle="What they have had, and what is next"
      status={
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void download()}
            disabled={saving || records.length === 0}
            title={
              records.length === 0
                ? 'Nothing to export yet'
                : 'Download vaccine record (PDF)'
            }
            aria-label="Download vaccine record (PDF)"
            className="rounded-md text-slate-400 transition hover:bg-fp-brand-50 hover:text-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/30"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
          </Button>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2.5">
          <CardAction onClick={onAddVaccination}>
            <Plus className="size-3.5 text-slate-500" />
            Add a vaccine or booster
          </CardAction>

          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="size-3.5 shrink-0" />
            Your clinic&rsquo;s copy is the official one.
          </p>
        </div>
      }
    >
      {records.length === 0 ? (
        <EmptyState title="No vaccines saved yet">
          Add a rabies vaccine or a booster date and this becomes the record a
          boarding kennel or a new vet asks to see.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {records.map((record) => (
            <VaccinationRow key={record.name} record={record} />
          ))}
        </ul>
      )}
    </CareCard>
  )
}

function VaccinationRow({ record }: { record: VaccinationRecord }) {
  const StateIcon = STATE_ICONS[record.state]
  const style = STATE_STYLES[record.state]

  return (
    <li className="flex items-start gap-3 py-3 text-xs">
      <span
        className={cn(
          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
          style.node,
        )}
      >
        <StateIcon className="size-3.5" strokeWidth={2.5} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-semibold text-slate-800">{record.name}</p>
          <p className="shrink-0 font-medium text-slate-700">
            {record.validity}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[11px] text-slate-500">{record.detail}</p>

          {record.state === 'active' ? null : (
            <p
              className={cn(
                'shrink-0 text-[10px] font-semibold',
                style.caption,
              )}
            >
              {style.label}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
