import { ArrowRight, CalendarDays, CalendarPlus } from 'lucide-react'

import { CardAction, CareCard, EmptyState, Inset, Pill } from './primitives'
import { Button } from '@/components/ui/button'
import { downloadAppointmentInvite } from '../utils/downloads'
import type { AppointmentRecord } from '../types'

export function AppointmentsCard({
  appointment,
  petName,
  onReschedule,
  onError,
}: {
  appointment: AppointmentRecord | null
  petName: string
  onReschedule: () => void
  onError: (message: string) => void
}) {
  const addToCalendar = () => {
    if (!appointment) return
    try {
      downloadAppointmentInvite({ appointment, petName })
    } catch {
      onError('That appointment could not be added to a calendar')
    }
  }

  return (
    <CareCard
      icon={CalendarDays}
      iconTone="neutral"
      title="Vet visits"
      subtitle={appointment?.clinic ?? 'No clinic saved yet'}
      status={
        appointment ? (
          <Pill tone="secondary">{appointment.badge}</Pill>
        ) : (
          <Pill>None booked</Pill>
        )
      }
      footer={
        appointment ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={addToCalendar}
              className="h-auto flex-1 gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-fp-brand-700"
            >
              <CalendarPlus className="size-3.5 text-slate-500" />
              Add to calendar
            </Button>
            <Button
              variant="ghost"
              onClick={onReschedule}
              className="h-auto rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
            >
              Change the date
            </Button>
          </div>
        ) : (
          <CardAction to="/nearby-vets">
            Find a vet nearby
            <ArrowRight className="size-3.5 text-slate-500" />
          </CardAction>
        )
      }
    >
      {appointment ? (
        <Inset className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fp-brand-100 text-sm font-bold text-fp-brand-800 ring-1 ring-fp-brand-200">
              {appointment.vetPhotoUrl ? (
                <img
                  src={appointment.vetPhotoUrl}
                  alt={appointment.vetName}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                appointment.vetName.replace(/^Dr\.?\s*/, '').slice(0, 1)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">
                {appointment.vetName}
              </p>
              <p className="text-[11px] text-slate-500">
                {appointment.vetRole}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-[10px] font-bold tracking-wider text-fp-brand-700 uppercase">
              {appointment.title}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-700">
              {appointment.when}
            </p>
            <p className="text-[11px] text-slate-500">{appointment.address}</p>
          </div>
        </Inset>
      ) : (
        <EmptyState title="No visit booked">
          Book a check-up and it shows up here, with a reminder and a calendar
          invite you can save.
        </EmptyState>
      )}
    </CareCard>
  )
}
