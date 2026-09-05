import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { RecordDialog, controlStyles, labelStyles } from './RecordDialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useRescheduleAppointment } from '../hooks/usePetProfiles'
import { rescheduleSchema } from '../schemas'
import type { RescheduleValues } from '../schemas'
import type { AppointmentRecord } from '../types'

function nowValue() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}`
  )
}

export function RescheduleDialog({
  open,
  onOpenChange,
  appointment,
  petName,
  onRescheduled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: AppointmentRecord
  petName: string
  onRescheduled: () => void
}) {
  const form = useForm<RescheduleValues>({
    resolver: zodResolver(rescheduleSchema),
    mode: 'onTouched',
    defaultValues: { startsAt: appointment.startsAt },
  })
  const { mutate, isPending, error, reset } = useRescheduleAppointment()

  React.useEffect(() => {
    if (open) {
      form.reset({ startsAt: appointment.startsAt })
      reset()
    }
  }, [open, appointment.startsAt, form, reset])

  const submit = form.handleSubmit((values) => {
    mutate(
      { appointmentId: appointment.id, startsAt: values.startsAt },
      {
        onSuccess: () => {
          onOpenChange(false)
          onRescheduled()
        },
      },
    )
  })

  return (
    <RecordDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Move ${petName}’s visit`}
      description={`${appointment.title} · ${appointment.clinic}. Currently ${appointment.when}.`}
      submitLabel="Save new time"
      pendingLabel="Moving…"
      pending={isPending}
      error={error?.message ?? null}
      onSubmit={(event) => void submit(event)}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="startsAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelStyles}>New date and time</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  type="datetime-local"
                  min={nowValue()}
                  className={controlStyles}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-[11px] text-slate-500">
                Confirm the new slot with {appointment.clinic} first — this
                updates your record, not their calendar.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </RecordDialog>
  )
}
