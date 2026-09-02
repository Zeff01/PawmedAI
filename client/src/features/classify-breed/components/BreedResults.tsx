import type { ReactNode } from 'react'
import type { BreedClassificationResult, BreedSize } from '../types'
import {
  ExclamationCircleIcon,
  MapPinIcon,
  HeartIcon,
  LightBulbIcon,
  PresentationChartLineIcon,
  SwatchIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/solid'
import { BreedReferenceCompare } from './BreedReferenceCompare'

const SIZE_LABELS: Record<BreedSize, string> = {
  small: 'Small breed',
  medium: 'Medium breed',
  large: 'Large breed',
  'extra-large': 'Extra-large breed',
}

function confidenceTone(value: number) {
  if (value >= 80)
    return {
      label: 'Strong match',
      bar: 'bg-emerald-500',
      text: 'text-emerald-600',
    }
  if (value >= 50)
    return {
      label: 'Likely match',
      bar: 'bg-amber-400',
      text: 'text-amber-600',
    }
  return { label: 'Rough guess', bar: 'bg-orange-400', text: 'text-orange-600' }
}

/** Small uppercase label used for every field in the card. */
function FieldLabel({
  children,
  icon,
}: {
  children: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 text-slate-400">
      {icon}
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {children}
      </p>
    </div>
  )
}

/** A number alone reads as precision it does not have — show the scale too. */
function ConfidenceMeter({ value }: { value: number }) {
  const tone = confidenceTone(value)
  return (
    <div>
      <FieldLabel icon={<PresentationChartLineIcon className="h-3.5 w-3.5" />}>
        Confidence
      </FieldLabel>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[18px] font-extrabold leading-none text-slate-900">
          {value}%
        </span>
        <span className={`text-[11.5px] font-bold ${tone.text}`}>
          {tone.label}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

function TagList({
  items,
  color = 'blue',
}: {
  items: string[]
  color?: 'blue' | 'slate'
}) {
  const cls =
    color === 'blue'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : 'border-slate-200 bg-white text-slate-600'
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${cls}`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li
          key={item}
          className="flex gap-3 text-[13px] leading-relaxed text-slate-700"
        >
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  )
}

/**
 * One row of the profile. The body stacks these with hairline dividers, so a
 * hidden field cannot leave a dangling separator behind it.
 */
function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string
  hint?: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="py-5">
      <FieldLabel icon={icon}>{label}</FieldLabel>
      {hint && <p className="mt-1 text-[12px] text-slate-400">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

export function BreedResults({
  result,
  previewUrl,
}: {
  result: BreedClassificationResult
  previewUrl: string | null
}) {
  if (result.not_identified) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Unable to identify
            </p>
            <h2 className="mt-1 text-[18px] font-extrabold leading-snug text-slate-900">
              We could not pin down a breed this time.
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              Nothing is wrong on your end — the identifier just needs a clearer
              signal to work from.
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] font-bold text-slate-900">
            What usually helps
          </p>
          <ul className="mt-2.5 flex flex-col gap-2">
            {[
              'One animal in frame, facing the camera.',
              'Even lighting — no harsh shadows or flash glare.',
              'A sharp, full-size photo rather than a crop of a crop.',
              'Add a written description too: size, coat, colour, and ears.',
            ].map((tip) => (
              <li
                key={tip}
                className="flex gap-2.5 text-[13px] leading-relaxed text-slate-600"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise-in overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Header — the same flat hero treatment as an animal profile, so a
          result and a library entry read as the same kind of page. */}
      <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-6 sm:flex-row sm:px-7 sm:py-7">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Identified pet"
            className="h-24 w-24 shrink-0 rounded-lg border border-slate-200 object-cover sm:h-28 sm:w-28"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[12px] font-bold capitalize text-blue-700">
              {result.animal_type}
            </span>
            {/* Guarded: an off-spec size from the model would otherwise render
                an empty pill. */}
            {SIZE_LABELS[result.size] && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-bold text-slate-600">
                {SIZE_LABELS[result.size]}
              </span>
            )}
          </div>

          <h2 className="mt-3 text-[30px] font-extrabold leading-[1.1] tracking-tight text-slate-950 sm:text-[36px]">
            {result.breed_name}
          </h2>

          {result.description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              {result.description}
            </p>
          )}

          {/* One bordered frame with hairline cells rather than boxes floating
              inside the card. */}
          <div className="mt-5 grid overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-2">
            <div className="px-4 py-3.5">
              <ConfidenceMeter value={result.confidence} />
            </div>
            {result.origin && (
              <div className="border-t border-slate-200 px-4 py-3.5 sm:border-t-0 sm:border-l">
                <FieldLabel icon={<MapPinIcon className="h-3.5 w-3.5" />}>
                  Origin
                </FieldLabel>
                <p className="mt-1.5 text-[14px] font-extrabold leading-snug text-slate-900">
                  {result.origin}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* A weak match is worth saying out loud before the profile is read */}
      {result.confidence < 50 && (
        <div className="flex items-start gap-2.5 border-b border-amber-200 bg-amber-50 px-6 py-3.5 sm:px-7">
          <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12.5px] leading-relaxed text-amber-900">
            Low confidence — treat this as a starting point. A brighter photo
            with the animal facing the camera, or a few extra details about size
            and coat, usually sharpens the result.
          </p>
        </div>
      )}

      <BreedReferenceCompare
        breedName={result.breed_name}
        animalType={result.animal_type}
        previewUrl={previewUrl}
      />

      {/* Body */}
      <div className="flex flex-col divide-y divide-slate-100 px-6 sm:px-7">
        {result.temperament.length > 0 && (
          <Field
            label="Temperament"
            hint="How this breed usually behaves and reacts."
            icon={<FaceSmileIcon className="h-3.5 w-3.5" />}
          >
            <TagList items={result.temperament} color="blue" />
          </Field>
        )}

        {result.common_traits.length > 0 && (
          <Field
            label="Common traits"
            hint="Features that tend to show up in this breed."
            icon={<SwatchIcon className="h-3.5 w-3.5" />}
          >
            <TagList items={result.common_traits} color="slate" />
          </Field>
        )}

        {result.care_tips.length > 0 && (
          <Field
            label="Care tips"
            icon={<HeartIcon className="h-3.5 w-3.5 text-rose-400" />}
          >
            <NumberedList items={result.care_tips} />
          </Field>
        )}

        {result.fun_fact && (
          <div className="py-5">
            {/* The one deliberate highlight in the body — it stays a tinted
                panel because nothing around it is boxed any more. */}
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
              <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Fun fact
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-amber-950">
                  {result.fun_fact}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer — a footnote, not a third stacked panel */}
        <p className="py-4 text-[11.5px] leading-relaxed text-slate-400">
          This is an AI-powered breed suggestion based on visual features. For a
          confirmed pedigree, consult a certified breeder or veterinarian.
        </p>
      </div>
    </div>
  )
}
