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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddMedication } from '../hooks/usePetProfiles'
import { medicationDraftSchema } from '../schemas'
import type { MedicationDraftValues } from '../schemas'

const FORMS = [
  { value: 'pill', label: 'Pill or tablet' },
  { value: 'chew', label: 'Soft chew' },
  { value: 'topical', label: 'Topical' },
  { value: 'liquid', label: 'Liquid' },
] as const

const CADENCES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'as_needed', label: 'As needed' },
] as const

const EMPTY: MedicationDraftValues = {
  name: '',
  detail: '',
  form: 'pill',
  cadence: 'monthly',
  nextDueOn: '',
}

export function AddMedicationDialog({
  open,
  onOpenChange,
  petId,
  petName,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  petId: string
  petName: string
  onAdded: (name: string) => void
}) {
  const form = useForm<MedicationDraftValues>({
    resolver: zodResolver(medicationDraftSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  })
  const { mutate, isPending, error, reset } = useAddMedication()

  React.useEffect(() => {
    if (open) {
      form.reset(EMPTY)
      reset()
    }
  }, [open, form, reset])

  const submit = form.handleSubmit((values) => {
    mutate(
      { petId, draft: values },
      {
        onSuccess: () => {
          onOpenChange(false)
          onAdded(values.name.trim())
        },
      },
    )
  })

  return (
    <RecordDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Add a medicine for ${petName}`}
      description="Flea and tick treatments, worming, vitamins, anything the vet prescribed — each one gets its own dose reminder."
      submitLabel="Save medicine"
      pendingLabel="Saving…"
      pending={isPending}
      error={error?.message ?? null}
      onSubmit={(event) => void submit(event)}
    >
      <Form {...form}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Medicine</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    placeholder="NexGard Spectra"
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
            name="detail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Dose, or what it is for
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="1 chew · flea, tick and heartworm"
                    className={controlStyles}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-500">
                  Optional — what the card shows under the name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="form"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={controlStyles}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FORMS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cadence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>How often</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={controlStyles}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CADENCES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nextDueOn"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Next dose due</FormLabel>
                <FormControl>
                  <Input type="date" className={controlStyles} {...field} />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-500">
                  Optional. Set it and the card counts down; each logged dose
                  moves it on by one interval.
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
