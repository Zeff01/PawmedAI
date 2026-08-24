import { CheckIcon } from '@heroicons/react/24/solid'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SAMPLE_QUALITY_OPTIONS } from '../constants'
import type { SampleQualityFlag } from '../types'

type SupportingContextFormProps = {
  sampleQuality: Array<SampleQualityFlag>
  smearMorphology: string
  onSampleQualityChange: (next: Array<SampleQualityFlag>) => void
  onSmearMorphologyChange: (next: string) => void
  disabled?: boolean
}

const MAX_SMEAR_LENGTH = 2000

export function SupportingContextForm({
  sampleQuality,
  smearMorphology,
  onSampleQualityChange,
  onSmearMorphologyChange,
  disabled = false,
}: SupportingContextFormProps) {
  const toggle = (flag: SampleQualityFlag) => {
    onSampleQualityChange(
      sampleQuality.includes(flag)
        ? sampleQuality.filter((item) => item !== flag)
        : [...sampleQuality, flag],
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Sample quality
        </Label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUALITY_OPTIONS.map((option) => {
            const selected = sampleQuality.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                disabled={disabled}
                aria-pressed={selected}
                title={option.hint}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                {option.label}
              </button>
            )
          })}
        </div>
        <p className="text-[10.5px] leading-relaxed text-slate-400">
          Flag anything you noticed in the tube. The brief will say which
          indices that flag can shift.
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="cbc-smear"
          className="text-[11px] font-bold uppercase tracking-wide text-slate-500"
        >
          Blood smear / morphology
        </Label>
        <Textarea
          id="cbc-smear"
          rows={4}
          value={smearMorphology}
          disabled={disabled}
          maxLength={MAX_SMEAR_LENGTH}
          onChange={(event) => onSmearMorphologyChange(event.target.value)}
          placeholder="e.g. platelet clumping, schistocytes, band neutrophils, polychromasia…"
          className="min-h-24 rounded-lg text-[12.5px] leading-relaxed"
        />
        <p className="text-right text-[10px] text-slate-400">
          {smearMorphology.length}/{MAX_SMEAR_LENGTH}
        </p>
      </div>
    </div>
  )
}
