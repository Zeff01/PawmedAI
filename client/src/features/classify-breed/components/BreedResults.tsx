import type { BreedClassificationResult, BreedSize } from '../types'
import {
  ExclamationCircleIcon,
  SparklesIcon,
  MapPinIcon,
  HeartIcon,
  LightBulbIcon,
} from '@heroicons/react/24/solid'
import { BreedReferenceCompare } from './BreedReferenceCompare'

function Divider() {
  return <hr className="h-px border-0 bg-slate-200" />
}

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
      bar: 'bg-emerald-400',
      text: 'text-emerald-100',
    }
  if (value >= 50)
    return {
      label: 'Likely match',
      bar: 'bg-amber-300',
      text: 'text-amber-100',
    }
  return { label: 'Rough guess', bar: 'bg-orange-300', text: 'text-orange-100' }
}

/** A number alone reads as precision it does not have — show the scale too. */
function ConfidenceMeter({ value }: { value: number }) {
  const tone = confidenceTone(value)
  return (
    <div className="w-full max-w-52 rounded-xl border border-white/25 bg-white/10 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
          Confidence
        </span>
        <span className="text-[15px] font-extrabold text-white">{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/25">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <p className={`mt-1 text-[11px] font-semibold ${tone.text}`}>
        {tone.label}
      </p>
    </div>
  )
}

function TagList({
  items,
  color = 'blue',
}: {
  items: string[]
  color?: string
}) {
  const cls =
    color === 'blue'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : color === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-slate-50 text-slate-600 border-slate-200'
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium ${cls}`}
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
        <li key={item} className="flex gap-3 text-[13px] text-slate-700">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
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
      <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white">
        <div className="flex items-start gap-3 border-b border-blue-200/60 bg-blue-600 px-6 py-5 text-white">
          <ExclamationCircleIcon className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
              Unable to identify
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              We could not pin down a breed this time.
            </h2>
            <p className="mt-2 text-sm text-blue-100/90">
              Nothing is wrong on your end — the identifier just needs a clearer
              signal to work from.
            </p>
          </div>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">What usually helps:</p>
          <ul className="space-y-2">
            {[
              'One animal in frame, facing the camera.',
              'Even lighting — no harsh shadows or flash glare.',
              'A sharp, full-size photo rather than a crop of a crop.',
              'Add a written description too: size, coat, colour, and ears.',
            ].map((tip) => (
              <li key={tip} className="flex gap-2.5 text-[13px]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_20px_rgba(15,28,63,0.06)]">
      {/* Header */}
      <div className="relative overflow-hidden bg-blue-700 px-6 py-7 sm:px-7 sm:py-8">
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/20" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start">
          {previewUrl && (
            <div className="shrink-0">
              <img
                src={previewUrl}
                alt="Identified pet"
                className="h-28 w-28 rounded-2xl border-2 border-white/30 object-cover sm:h-32 sm:w-32"
              />
            </div>
          )}
          <div className="flex-1 space-y-2.5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-white">
                {result.animal_type}
              </span>
              <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {SIZE_LABELS[result.size]}
              </span>
            </div>
            <h2 className="text-[30px] font-extrabold leading-tight text-white">
              {result.breed_name}
            </h2>
            <p className="max-w-2xl text-[14px] leading-relaxed text-blue-100">
              {result.description}
            </p>
            <div className="flex flex-wrap items-end gap-3 pt-1">
              <ConfidenceMeter value={result.confidence} />
              {result.origin && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white">
                  <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-blue-200" />
                  {result.origin}
                </div>
              )}
            </div>
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
      <div className="space-y-6 px-6 py-7 sm:px-7">
        {/* Temperament */}
        {result.temperament.length > 0 && (
          <>
            <div>
              <div className="mb-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Temperament
                </p>
                <span className="text-xs text-muted-foreground">
                  Animal’s typical behavior and reaction style.
                </span>
              </div>
              <TagList items={result.temperament} color="blue" />
            </div>
            <Divider />
          </>
        )}

        {/* Common traits */}
        {result.common_traits.length > 0 && (
          <>
            <div>
              <div className="mb-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Common Traits
                </p>

                <span className="text-xs text-muted-foreground">
                  Usual behavioral patterns and response tendencies of an
                  animal.
                </span>
              </div>
              <TagList items={result.common_traits} color="slate" />
            </div>
            <Divider />
          </>
        )}

        {/* Care tips */}
        {result.care_tips.length > 0 && (
          <>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <HeartIcon className="h-4 w-4 text-rose-500" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Care Tips
                </p>
              </div>
              <NumberedList items={result.care_tips} />
            </div>
            <Divider />
          </>
        )}

        {/* Fun fact */}
        {result.fun_fact && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <LightBulbIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-amber-600">
                Fun Fact
              </p>
              <p className="text-[13px] leading-relaxed text-slate-700">
                {result.fun_fact}
              </p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-[11px] leading-relaxed text-slate-500">
            This is an AI-powered breed suggestion based on visual features. For
            a confirmed pedigree, consult a certified breeder or veterinarian.
          </p>
        </div>
      </div>
    </div>
  )
}
