import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Check,
  FileUp,
  Pill as PillIcon,
  ScanEye,
  Scale,
  Syringe,
  Zap,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { Button } from '@/components/ui/button'
import { useLogMedicationDose } from '../hooks/usePetProfiles'
import type { DueDose } from '../care-priorities'

const MAX_DOSES = 3

const SHORTCUT =
  'h-auto justify-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 ' +
  'font-fp-sans text-xs font-semibold text-slate-700 shadow-none transition ' +
  'hover:bg-slate-50 hover:text-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/30'

export function QuickActions({
  petName,
  doses,
  onLogWeight,
  onAddMedication,
  onAddVaccination,
  onUpload,
  onLogged,
  onError,
}: {
  petName: string
  doses: Array<DueDose>
  onLogWeight: () => void
  onAddMedication: () => void
  onAddVaccination: () => void
  onUpload: () => void
  onLogged: (dose: DueDose) => void
  onError: (message: string) => void
}) {
  const { mutate } = useLogMedicationDose()

  const [pendingId, setPendingId] = React.useState<string | null>(null)

  const logDose = (dose: DueDose) => {
    setPendingId(dose.medicationId)
    mutate(
      { medicationId: dose.medicationId },
      {
        onSuccess: () => onLogged(dose),
        onError: (error) => onError(error.message),
        onSettled: () => setPendingId(null),
      },
    )
  }

  return (
    <section
      aria-label="Quick actions"
      className="flex flex-col gap-3 rounded-xl border border-fp-border bg-white p-4 shadow-fp-subtle sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 pr-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          <Zap className="size-3.5 text-fp-brand-600" />
          Quick actions
        </span>

        {doses.slice(0, MAX_DOSES).map((dose) => (
          <Button
            key={dose.medicationId}
            onClick={() => logDose(dose)}
            disabled={pendingId === dose.medicationId}
            title={`${dose.medicationName} for ${dose.petName} · ${dose.note}`}
            className="h-auto gap-1.5 rounded-lg bg-fp-brand-800 px-3 py-2 font-fp-sans text-xs font-semibold text-white shadow-fp-subtle transition hover:bg-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/40"
          >
            <Check className="size-3.5 text-emerald-300" />
            <span className="max-w-40 truncate">
              Gave {dose.medicationName}
            </span>
            <span className="text-emerald-200/80">· {dose.petName}</span>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Shortcut icon={Scale} onClick={onLogWeight}>
          Log weight
        </Shortcut>
        <Shortcut icon={PillIcon} onClick={onAddMedication}>
          Add a medicine
        </Shortcut>
        <Shortcut icon={Syringe} onClick={onAddVaccination}>
          Add a vaccine
        </Shortcut>
        <Shortcut icon={FileUp} onClick={onUpload}>
          Add a file
        </Shortcut>

        <Button asChild variant="ghost" className={SHORTCUT}>
          <Link to="/classify" title={`Start a photo checkup for ${petName}`}>
            <ScanEye className="size-3.5 text-slate-500" />
            Photo checkup
          </Link>
        </Button>
      </div>
    </section>
  )
}

function Shortcut({
  icon: Icon,
  onClick,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={SHORTCUT}
    >
      <Icon className="size-3.5 text-slate-500" />
      {children}
    </Button>
  )
}
