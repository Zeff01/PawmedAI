import {
  Bone,
  CalendarClock,
  Check,
  Pill as PillIcon,
  Plus,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { TEXT_TONES } from './care-tones'
import { CardAction, CareCard, EmptyState, Pill } from './primitives'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLogMedicationDose } from '../hooks/usePetProfiles'
import type { CareStatus, MedicationRecord } from '../types'

const MED_ICONS: Record<
  MedicationRecord['icon'],
  ComponentType<{ className?: string }>
> = {
  pill: PillIcon,
  chew: Bone,
}

export function MedicationsCard({
  medications,
  onAddMedication,
  onError,
}: {
  medications: { status: CareStatus; records: Array<MedicationRecord> }
  onAddMedication: () => void
  onError: (message: string) => void
}) {
  const { records } = medications
  const count = records.length

  const due = records.filter((record) => record.noteTone !== 'primary').length

  return (
    <CareCard
      icon={PillIcon}
      iconTone="tertiary"
      title="Medicines"
      subtitle="Flea, tick, worm &amp; prescriptions"
      status={
        count === 0 ? (
          <Pill>None right now</Pill>
        ) : due === 0 ? (
          <Pill tone="primary">All given today</Pill>
        ) : (
          <Pill tone="tertiary">{due} to give</Pill>
        )
      }
      footer={
        <CardAction onClick={onAddMedication}>
          <Plus className="size-3.5 text-slate-500" />
          Add a medicine
        </CardAction>
      }
    >
      {count === 0 ? (
        <EmptyState title="No medicines saved yet">
          Flea, tick and worm treatments show up here once you add them, with a
          reminder before each dose is due.
        </EmptyState>
      ) : (
        <>
          {records.map((record) => (
            <MedicationRow key={record.id} record={record} onError={onError} />
          ))}
        </>
      )}
    </CareCard>
  )
}

function MedicationRow({
  record,
  onError,
}: {
  record: MedicationRecord
  onError: (message: string) => void
}) {
  const MedIcon = MED_ICONS[record.icon]
  const { mutate, isPending } = useLogMedicationDose()
  const givenToday = record.noteTone === 'primary'

  const logDose = () =>
    mutate(
      { medicationId: record.id },
      { onError: (error) => onError(error.message) },
    )

  return (
    <div className="overflow-hidden rounded-lg border border-amber-100 bg-amber-50/50">
      <div className="flex items-start justify-between gap-3 p-3 pb-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <MedIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <h4 className="truncate text-xs font-bold text-slate-800">
              {record.name}
            </h4>
            <p className="truncate text-[11px] text-slate-500">
              {record.detail}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
          {record.cadence}
        </span>
      </div>

      <div className="flex flex-col items-start gap-x-2 gap-y-0.5 px-3 pb-2.5">
        <p
          className={cn(
            'flex items-center gap-1 text-[11px] font-semibold',
            TEXT_TONES[record.noteTone],
          )}
        >
          {givenToday ? <Check className="size-3" /> : null}
          {record.note}
        </p>

        {givenToday && record.nextDue ? (
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <CalendarClock className="size-3 text-slate-400" />
            {record.nextDue}
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={logDose}
        disabled={isPending}
        className={cn(
          'h-auto w-full justify-start gap-1.5 rounded-none',
          'border-x-0 border-t border-b-0 border-amber-100',
          'px-3 py-2.5 font-fp-sans text-[11px] font-semibold text-fp-brand-700',
          'transition hover:bg-amber-100/60 hover:text-fp-brand-800',
          'focus-visible:ring-2 focus-visible:ring-fp-brand-500/30 focus-visible:ring-inset',
          isPending && 'cursor-progress',
        )}
      >
        <Plus className="size-3" />
        {isPending
          ? 'Saving…'
          : givenToday
            ? 'Mark another dose given'
            : 'Mark this dose as given'}
      </Button>
    </div>
  )
}
