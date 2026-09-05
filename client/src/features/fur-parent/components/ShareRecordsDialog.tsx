import * as React from 'react'
import { CalendarPlus, Copy, FileDown, Share2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  downloadAppointmentInvite,
  downloadVaccinationRecord,
  householdSummaryText,
} from '../utils/downloads'
import type { FurParentPet, PetWellness } from '../types'

const ROW_ACTION =
  'h-auto w-full justify-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 ' +
  'font-fp-sans text-xs font-semibold text-slate-700 shadow-none transition ' +
  'hover:bg-slate-50 hover:text-fp-brand-700 focus-visible:ring-2 focus-visible:ring-fp-brand-500/30'

export function ShareRecordsDialog({
  open,
  onOpenChange,
  ownerName,
  pets,
  wellnessByPet,
  onShared,
  onError,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ownerName: string
  pets: Array<FurParentPet>
  wellnessByPet: Record<string, PetWellness>
  onShared: (message: string) => void
  onError: (message: string) => void
}) {
  const [busyPetId, setBusyPetId] = React.useState<string | null>(null)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  const savePdf = async (pet: FurParentPet) => {
    const wellness = wellnessByPet[pet.id]

    setBusyPetId(pet.id)
    try {
      await downloadVaccinationRecord({
        petName: pet.name,
        breed: pet.breed,
        ageLabel: pet.ageLabel,
        syncedLabel: wellness.syncedLabel,
        statusLabel: wellness.vaccinations.status.label,
        records: wellness.vaccinations.records,
      })
      onShared(`${pet.name}’s vaccination record was downloaded`)
    } catch {
      onError(`${pet.name}’s vaccination record could not be generated`)
    } finally {
      setBusyPetId(null)
    }
  }

  const saveInvite = (pet: FurParentPet) => {
    const { appointment } = wellnessByPet[pet.id]
    if (!appointment) return

    try {
      downloadAppointmentInvite({ appointment, petName: pet.name })
      onShared(`${pet.name}’s visit was saved as a calendar invite`)
    } catch {
      onError('That appointment could not be added to a calendar')
    }
  }

  const shareSummary = async () => {
    const text = householdSummaryText({ ownerName, pets, wellnessByPet })

    try {
      if (canShare) {
        await navigator.share({ title: 'Pawmed AI care summary', text })
        onShared('Care summary shared')
        return
      }

      await navigator.clipboard.writeText(text)
      onShared('Care summary copied to your clipboard')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      onError('That summary could not be shared from this browser')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-fp-border bg-white font-fp-sans shadow-fp-elevated">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            Share records
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Everything here is built on this device from the records on screen —
            nothing is published to a link.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          {pets.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500">
              Add a pet and its record becomes shareable from here.
            </p>
          ) : (
            pets.map((pet) => {
              const wellness = wellnessByPet[pet.id]
              const shots = wellness.vaccinations.records.length

              return (
                <div
                  key={pet.id}
                  className="flex flex-col gap-2 rounded-xl border border-fp-border bg-fp-subtle/60 p-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {pet.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {pet.breed}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => void savePdf(pet)}
                    disabled={shots === 0 || busyPetId === pet.id}
                    className={ROW_ACTION}
                  >
                    <FileDown className="size-3.5 text-slate-500" />
                    {busyPetId === pet.id
                      ? 'Preparing PDF…'
                      : shots === 0
                        ? 'No vaccines saved to send yet'
                        : `Vaccine record (PDF · ${shots} ${
                            shots === 1 ? 'vaccine' : 'vaccines'
                          })`}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => saveInvite(pet)}
                    disabled={!wellness.appointment}
                    className={ROW_ACTION}
                  >
                    <CalendarPlus className="size-3.5 text-slate-500" />
                    {wellness.appointment
                      ? `Next visit invite (${wellness.appointment.badge})`
                      : 'No visit booked yet'}
                  </Button>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter className="mt-2 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => void shareSummary()}
            disabled={pets.length === 0}
            className="h-auto justify-center gap-2 rounded-lg bg-fp-brand-800 px-4 py-2.5 text-xs font-semibold text-white shadow-fp-subtle transition hover:bg-fp-brand-700 hover:text-white focus-visible:ring-2 focus-visible:ring-fp-brand-500/40"
          >
            {canShare ? (
              <Share2 className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {canShare ? 'Share a care summary' : 'Copy a care summary'}
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-auto px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
