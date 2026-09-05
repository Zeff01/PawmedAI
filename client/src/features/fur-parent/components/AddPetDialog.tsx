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
import { useCreatePet } from '../hooks/usePetProfiles'
import { petDraftSchema } from '../schemas'
import type { PetDraftValues } from '../schemas'

const SPECIES = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'other', label: 'Another companion' },
] as const

const SEXES = [
  { value: 'unknown', label: 'Prefer not to say' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
] as const

const NEUTER = [
  { value: 'unknown', label: 'Not sure' },
  { value: 'intact', label: 'Intact' },
  { value: 'neutered', label: 'Neutered' },
  { value: 'spayed', label: 'Spayed' },
] as const

const EMPTY: PetDraftValues = {
  name: '',
  species: 'dog',
  breed: '',
  sex: 'unknown',
  neuterStatus: 'unknown',
  birthDate: '',
  idealWeightKg: '',
}

export function AddPetDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded?: (name: string) => void
}) {
  const form = useForm<PetDraftValues>({
    resolver: zodResolver(petDraftSchema),
    mode: 'onTouched',
    defaultValues: EMPTY,
  })
  const { mutate, isPending, error, reset } = useCreatePet()

  React.useEffect(() => {
    if (open) {
      form.reset(EMPTY)
      reset()
    }
  }, [open, form, reset])

  const submit = form.handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        onAdded?.(values.name.trim())
        onOpenChange(false)
      },
    })
  })

  return (
    <RecordDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a pet"
      description="Just a name is enough to start. Everything else can follow whenever you know it."
      submitLabel="Add to my family"
      pendingLabel="Adding…"
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
                <FormLabel className={labelStyles}>Name</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    placeholder="Milo"
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
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Species</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={controlStyles}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPECIES.map((option) => (
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
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Breed</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Golden Retriever"
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
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Sex</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={controlStyles}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEXES.map((option) => (
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
              name="neuterStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Neuter status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={controlStyles}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NEUTER.map((option) => (
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
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>Birthday</FormLabel>
                  <FormControl>
                    <Input type="date" className={controlStyles} {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px] text-slate-500">
                    Sets the age on their card.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idealWeightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyles}>
                    Target weight (kg)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      placeholder="31.0"
                      className={controlStyles}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px] text-slate-500">
                    Your vet’s ideal, if you know it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </Form>
    </RecordDialog>
  )
}
