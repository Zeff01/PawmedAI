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
import { useAddVaccination } from '../hooks/usePetProfiles'
import { vaccinationDraftSchema } from '../schemas'
import type { VaccinationDraftValues } from '../schemas'

function todayValue() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const EMPTY: VaccinationDraftValues = {
  name: '',
  administeredOn: '',
  dueOn: '',
  clinic: '',
}

export function AddVaccinationDialog({
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
  const form = useForm<VaccinationDraftValues>({
    resolver: zodResolver(vaccinationDraftSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  })
  const { mutate, isPending, error, reset } = useAddVaccination()

  React.useEffect(() => {
    if (open) {
      form.reset(EMPTY)
      reset()
    }
  }, [open, form, reset])

  const submit = form.handleSubmit((values) => {
    mutate(
      { petId, ...values },
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
      title={`Add a vaccine for ${petName}`}
      description="Copy it off the certificate — this is the record a kennel or a new vet asks to see."
      submitLabel="Save vaccine"
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
                <FormLabel className={labelStyles}>Vaccine</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    placeholder="Rabies (3-year)"
                    className={controlStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="administeredOn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Given on</FormLabel>
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
              name="dueOn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Next due or expires
                  </FormLabel>
                  <FormControl>
                    <Input type="date" className={controlStyles} {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px] text-slate-500">
                    The date the card counts down to. One of the two is enough.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="clinic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Clinic</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Oakwood Animal Hospital"
                    className={controlStyles}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-500">
                  Optional — it shows under the vaccine’s name on the card.
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
