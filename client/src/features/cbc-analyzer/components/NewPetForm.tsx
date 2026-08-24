import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
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
import { NEUTER_OPTIONS, SEX_OPTIONS, SPECIES_OPTIONS } from '../constants'
import { newPetSchema } from '../patientSchema'
import type { NewPetFormValues } from '../patientSchema'
import type { CbcAnalysis } from '../types'

type NewPetFormProps = {
  analysis: CbcAnalysis
  hasPrefill: boolean
  onSubmit: (values: NewPetFormValues) => void
  isSaving: boolean
  footer: (submit: () => void) => React.ReactNode
}

const LABEL_CLASS =
  'text-[11px] font-bold uppercase tracking-wide text-slate-500'
const CONTROL_CLASS = 'h-10 rounded-lg text-[13px]'

export function NewPetForm({
  analysis,
  hasPrefill,
  onSubmit,
  isSaving,
  footer,
}: NewPetFormProps) {
  const { patient } = analysis
  const form = useForm<NewPetFormValues>({
    resolver: zodResolver(newPetSchema),
    mode: 'onTouched',
    defaultValues: {
      name: patient.pet_name,
      species: patient.species,
      speciesLabel: patient.species_label,
      ownerName: patient.owner_name,
      breed: patient.breed,
      ageYears: patient.age_years !== null ? String(patient.age_years) : '',
      sex: patient.sex,
      neuterStatus: patient.neuter_status,
    },
  })

  const species = form.watch('species')
  const submit = () => void form.handleSubmit(onSubmit)()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[14.5px] font-extrabold text-slate-900">
          Add a new patient
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          {hasPrefill
            ? 'Prefilled from the uploaded report — check it before saving. The result binds to the new profile straight away.'
            : 'The result binds to the new profile straight away.'}
        </p>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className={LABEL_CLASS}>
                  Patient name
                  <span aria-hidden="true" className="text-blue-600">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Buddy"
                    disabled={isSaving}
                    autoComplete="off"
                    className={CONTROL_CLASS}
                  />
                </FormControl>
                <FormMessage className="text-[11px] font-semibold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>
                  Species
                  <span aria-hidden="true" className="text-blue-600">
                    *
                  </span>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSaving}
                >
                  <FormControl>
                    <SelectTrigger
                      className={`w-full bg-white ${CONTROL_CLASS}`}
                    >
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[11px] font-semibold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Owner</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="M. Reyes"
                    disabled={isSaving}
                    autoComplete="off"
                    className={CONTROL_CLASS}
                  />
                </FormControl>
                <FormMessage className="text-[11px] font-semibold" />
              </FormItem>
            )}
          />

          {species === 'other' ? (
            <FormField
              control={form.control}
              name="speciesLabel"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className={LABEL_CLASS}>
                    Which species
                    <span aria-hidden="true" className="text-blue-600">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Rabbit"
                      disabled={isSaving}
                      autoComplete="off"
                      className={CONTROL_CLASS}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] font-semibold" />
                </FormItem>
              )}
            />
          ) : null}

          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Breed</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Golden Retriever"
                    disabled={isSaving}
                    autoComplete="off"
                    className={CONTROL_CLASS}
                  />
                </FormControl>
                <FormMessage className="text-[11px] font-semibold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ageYears"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>
                  Age
                  <span className="ml-auto text-[10px] font-semibold normal-case text-slate-400">
                    years
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.1"
                    placeholder="6"
                    disabled={isSaving}
                    className={CONTROL_CLASS}
                  />
                </FormControl>
                {fieldState.error ? (
                  <FormMessage className="text-[11px] font-semibold" />
                ) : (
                  <FormDescription className="text-[10px] text-slate-400">
                    Optional
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Sex</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSaving}
                >
                  <FormControl>
                    <SelectTrigger
                      className={`w-full bg-white ${CONTROL_CLASS}`}
                    >
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SEX_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[11px] font-semibold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="neuterStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={LABEL_CLASS}>Neuter status</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSaving}
                >
                  <FormControl>
                    <SelectTrigger
                      className={`w-full bg-white ${CONTROL_CLASS}`}
                    >
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NEUTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[11px] font-semibold" />
              </FormItem>
            )}
          />
        </div>
      </Form>

      {footer(submit)}
    </div>
  )
}

/** The create button, so the dialog's footer row stays consistent. */
export function NewPetSubmitButton({
  onClick,
  isSaving,
}: {
  onClick: () => void
  isSaving: boolean
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className="h-10 rounded-lg bg-blue-600 px-4 text-[12.5px] font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? (
        <>
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          Creating…
        </>
      ) : (
        'Create and bind'
      )}
    </Button>
  )
}
