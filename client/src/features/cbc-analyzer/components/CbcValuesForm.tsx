import * as React from 'react'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SERIES_GROUPS } from '../constants'

export type ValuesFormState = Record<string, string | undefined>

type CbcValuesFormProps = {
  values: ValuesFormState
  onChange: (next: ValuesFormState) => void
  extractedKeys?: Array<string>
  disabled?: boolean
}

export function CbcValuesForm({
  values,
  onChange,
  extractedKeys = [],
  disabled = false,
}: CbcValuesFormProps) {
  const extracted = React.useMemo(() => new Set(extractedKeys), [extractedKeys])

  const setValue = (key: string, next: string) =>
    onChange({ ...values, [key]: next })

  const filledCount = Object.values(values).filter(
    (value) => (value ?? '').trim() !== '',
  ).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-relaxed text-slate-500">
          Enter whatever your analyser reported — every field is optional and
          blanks are simply left out of the panel.
        </p>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
          {filledCount} entered
        </span>
      </div>

      {SERIES_GROUPS.map((group) => (
        <fieldset key={group.key} className="space-y-2.5">
          <legend className="text-[10.5px] font-extrabold uppercase tracking-widest text-blue-700">
            {group.label}
          </legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            {group.fields.map((field) => {
              const inputId = `cbc-value-${field.key}`
              const fromImage = extracted.has(field.key)
              return (
                <div
                  key={field.key}
                  className={`space-y-1.5 ${field.fullWidth ? 'col-span-2' : ''}`}
                >
                  <Label
                    htmlFor={inputId}
                    className="gap-1 text-[11px] font-semibold text-slate-600"
                  >
                    <span className="truncate">{field.label}</span>
                    {field.optional ? (
                      <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                        opt
                      </span>
                    ) : null}
                    {fromImage ? (
                      <span
                        title="Read from the uploaded report"
                        className="inline-flex shrink-0 items-center text-blue-500"
                      >
                        <SparklesIcon className="h-3 w-3" />
                      </span>
                    ) : null}
                  </Label>
                  <div className="relative">
                    <Input
                      id={inputId}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      disabled={disabled}
                      value={values[field.key] ?? ''}
                      onChange={(event) =>
                        setValue(field.key, event.target.value)
                      }
                      className={`h-9 rounded-lg pr-14 text-[13px] font-semibold tabular-nums ${
                        fromImage ? 'border-blue-200 bg-blue-50/40' : ''
                      }`}
                      placeholder="—"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-2 top-1/2 max-w-13 -translate-y-1/2 truncate text-right text-[9.5px] font-bold text-slate-400"
                    >
                      {field.unit}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
