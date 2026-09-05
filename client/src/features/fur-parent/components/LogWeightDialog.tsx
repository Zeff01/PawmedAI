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
import { useLogWeight } from '../hooks/usePetProfiles'
import { weightEntrySchema } from '../schemas'
import type { WeightEntryValues } from '../schemas'

function todayValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function LogWeightDialog({
  open,
  onOpenChange,
  petId,
  petName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  petId: string
  petName: string
}) {
  const form = useForm<WeightEntryValues>({
    resolver: zodResolver(weightEntrySchema),
    mode: 'onTouched',
    defaultValues: { weightKg: '', recordedOn: todayValue(), note: '' },
  })
  const { mutate, isPending, error, reset } = useLogWeight()

  React.useEffect(() => {
    if (open) {
      form.reset({ weightKg: '', recordedOn: todayValue(), note: '' })
      reset()
    }
  }, [open, form, reset])

  const submit = form.handleSubmit((values) => {
    mutate({ petId, ...values }, { onSuccess: () => onOpenChange(false) })
  })

  return (
    <RecordDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Log ${petName}’s weight`}
      description="Two weights are enough for the card to start showing whether your pet is gaining or losing."
      submitLabel="Save weight"
      pendingLabel="Saving…"
      pending={isPending}
      error={error?.message ?? null}
      onSubmit={(event) => void submit(event)}
    >
      <Form {...form}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="weightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    max="200"
                    placeholder="31.4"
                    className={controlStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recordedOn"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Weighed on</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    max={todayValue()}
                    className={controlStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Note</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Weighed after the morning walk"
                    className={controlStyles}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-500">
                  Optional — anything the number alone misses.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </RecordDialog>
  )
}
