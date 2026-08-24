import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid'
import type { UseFormReturn } from 'react-hook-form'
import {
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NEUTER_OPTIONS, SEX_OPTIONS, SPECIES_GROUPS } from '../constants'
import type { PatientFormValues } from '../patientSchema'

type PatientStepFieldsProps = {
  form: UseFormReturn<PatientFormValues>
  prefilled?: Array<keyof PatientFormValues>
  disabled?: boolean
}

export function PatientStepFields({
  form,
  prefilled = [],
  disabled = false,
}: PatientStepFieldsProps) {
  const fromReport = new Set(prefilled)
  const species = form.watch('species')

  const tint = (name: keyof PatientFormValues) =>
    fromReport.has(name) ? 'border-blue-200 bg-blue-50/40' : ''

  const reportHint = (name: keyof PatientFormValues) =>
    fromReport.has(name) ? (
      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600">
        <SparklesIcon className="h-3 w-3" />
        from report
      </span>
    ) : null

  return (
    <div className="space-y-5">
      {/* ── Species ─────────────────────────────────────────────────────── */}
      <FormField
        control={form.control}
        name="species"
        render={({ field }) => {
          const chosen = field.value as PatientFormValues['species'] | undefined
          return (
            <FormItem className="gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <FormLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Species
                  <span aria-hidden="true" className="text-blue-600">
                    *
                  </span>
                </FormLabel>
                {chosen ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Reference intervals set
                  </span>
                ) : (
                  <span className="text-[10.5px] font-semibold text-slate-400">
                    Decides what counts as normal
                  </span>
                )}
              </div>

              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="h-10 w-full rounded-lg bg-white text-[13px]">
                    <SelectValue placeholder="Select the species…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SPECIES_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        {group.label}
                      </SelectLabel>
                      {group.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-[11px] font-semibold" />
            </FormItem>
          )
        }}
      />

      {/* ── "Other" needs naming before it can be flagged ───────────────── */}
      {species === 'other' ? (
        <FormField
          control={form.control}
          name="speciesLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Which species
                <span aria-hidden="true" className="text-blue-600">
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Rabbit"
                  disabled={disabled}
                  autoComplete="off"
                  className="h-10 rounded-lg text-[13px]"
                />
              </FormControl>
              <FormDescription className="text-[10.5px] text-amber-600">
                No validated interval exists for this species here, so values
                are flagged only when they fall outside every common
                small-animal range.
              </FormDescription>
              <FormMessage className="text-[11px] font-semibold" />
            </FormItem>
          )}
        />
      ) : null}

      {/* ── Identity ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-x-3 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="petName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Patient name
                <span aria-hidden="true" className="text-blue-600">
                  *
                </span>
                {reportHint('petName')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Buddy"
                  disabled={disabled}
                  autoComplete="off"
                  className={`h-10 rounded-lg text-[13px] ${tint('petName')}`}
                />
              </FormControl>
              <FormMessage className="text-[11px] font-semibold" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ownerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Owner
                <span aria-hidden="true" className="text-blue-600">
                  *
                </span>
                {reportHint('ownerName')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="M. Reyes"
                  disabled={disabled}
                  autoComplete="off"
                  className={`h-10 rounded-lg text-[13px] ${tint('ownerName')}`}
                />
              </FormControl>
              <FormMessage className="text-[11px] font-semibold" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="breed"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Breed
                <span aria-hidden="true" className="text-blue-600">
                  *
                </span>
                {reportHint('breed')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Golden Retriever"
                  disabled={disabled}
                  autoComplete="off"
                  className={`h-10 rounded-lg text-[13px] ${tint('breed')}`}
                />
              </FormControl>
              {fieldState.error ? (
                <FormMessage className="text-[11px] font-semibold" />
              ) : (
                <FormDescription className="text-[10.5px] text-slate-400">
                  “Mixed” is fine if it is not a pedigree.
                </FormDescription>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageYears"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Age
                <span aria-hidden="true" className="text-blue-600">
                  *
                </span>
                {reportHint('ageYears') ?? (
                  <span className="ml-auto text-[10px] font-semibold normal-case text-slate-400">
                    years
                  </span>
                )}
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
                  disabled={disabled}
                  className={`h-10 rounded-lg text-[13px] ${tint('ageYears')}`}
                />
              </FormControl>
              {fieldState.error ? (
                <FormMessage className="text-[11px] font-semibold" />
              ) : (
                <FormDescription className="text-[10.5px] text-slate-400">
                  An estimate is fine — 0.5 for six months.
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
              <FormLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Sex
                <span aria-hidden="true" className="text-blue-600">
                  *
                </span>
                {reportHint('sex')}
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger
                    className={`h-10 w-full rounded-lg bg-white text-[13px] ${tint('sex')}`}
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
              <FormLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Neuter status
                <span aria-hidden="true" className="text-blue-600">
                  *
                </span>
                {reportHint('neuterStatus')}
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger
                    className={`h-10 w-full rounded-lg bg-white text-[13px] ${tint('neuterStatus')}`}
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

        {fromReport.size > 0 ? (
          <p className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-900 sm:col-span-2">
            <SparklesIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
            The highlighted fields were read off the uploaded report. Check them
            against the paper before saving.
          </p>
        ) : null}
      </div>
    </div>
  )
}
