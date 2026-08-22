import { PlusIcon } from '@heroicons/react/24/solid'

export const MIN_DESCRIPTION_LENGTH = 10
const GOOD_DESCRIPTION_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 2000

const DETAIL_HINTS = [
  'medium-sized dog',
  'curly cream coat',
  'floppy ears',
  'short black fur',
  'about 12 kg',
  'green eyes',
  'long bushy tail',
  'very playful',
]

type BreedDescriptionInputProps = {
  value: string
  onChange: (next: string) => void
  onSubmitShortcut: () => void
}

function strengthOf(length: number) {
  if (length === 0) return { step: 0, label: 'Nothing yet', tone: 'slate' }
  if (length < MIN_DESCRIPTION_LENGTH)
    return { step: 1, label: 'Too short', tone: 'amber' }
  if (length < GOOD_DESCRIPTION_LENGTH)
    return { step: 2, label: 'Usable', tone: 'blue' }
  return { step: 3, label: 'Great detail', tone: 'emerald' }
}

const TONE_TEXT: Record<string, string> = {
  slate: 'text-slate-400',
  amber: 'text-amber-600',
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
}

const TONE_BAR: Record<string, string> = {
  slate: 'bg-slate-200',
  amber: 'bg-amber-400',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
}

export function BreedDescriptionInput({
  value,
  onChange,
  onSubmitShortcut,
}: BreedDescriptionInputProps) {
  const trimmed = value.trim()
  const strength = strengthOf(trimmed.length)

  const appendHint = (hint: string) => {
    if (value.toLowerCase().includes(hint.toLowerCase())) return
    const separator = !value.trim() ? '' : /[,.\s]$/.test(value) ? ' ' : ', '
    onChange(`${value}${separator}${hint}`.slice(0, MAX_DESCRIPTION_LENGTH))
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="pet-description"
          className="text-[13px] font-bold text-slate-800"
        >
          Describe your pet
        </label>
        <p className="mt-0.5 text-[12px] text-slate-500">
          Size, coat, colour, ears, and temperament are the details that narrow
          a breed down.
        </p>
      </div>

      <textarea
        id="pet-description"
        name="pet-description"
        rows={5}
        maxLength={MAX_DESCRIPTION_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            onSubmitShortcut()
          }
        }}
        placeholder="Example: medium-sized dog, curly cream coat, floppy ears, about 12 kg, very friendly and playful…"
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13px] leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={`h-1.5 w-7 rounded-full transition-colors ${
                  strength.step >= step
                    ? TONE_BAR[strength.tone]
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span
            className={`text-[11.5px] font-bold ${TONE_TEXT[strength.tone]}`}
          >
            {strength.label}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {value.length}/{MAX_DESCRIPTION_LENGTH}
        </span>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick add
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DETAIL_HINTS.map((hint) => {
            const used = value.toLowerCase().includes(hint.toLowerCase())
            return (
              <button
                key={hint}
                type="button"
                onClick={() => appendHint(hint)}
                disabled={used}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition ${
                  used
                    ? 'cursor-default border-slate-100 bg-slate-50 text-slate-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {!used && <PlusIcon className="h-3 w-3" />}
                {hint}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
