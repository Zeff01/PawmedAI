import type { BreedClassificationResult, BreedSize } from '../types'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  MapPinIcon,
  HeartIcon,
  LightBulbIcon,
} from '@heroicons/react/24/solid'

function Divider() {
  return (
    <hr className="h-px border-0 bg-linear-to-r from-transparent via-slate-200 to-transparent" />
  )
}

const SIZE_COLORS: Record<BreedSize, string> = {
  small: 'bg-sky-50 text-sky-700 border-sky-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  large: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'extra-large': 'bg-violet-50 text-violet-700 border-violet-200',
}

function ConfidenceBadge({ value }: { value: number }) {
  const color =
    value >= 80
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : value >= 50
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-slate-50 text-slate-600 border-slate-200'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color}`}
    >
      <CheckCircleIcon className="h-3 w-3" />
      {value}% Match
    </span>
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
      <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/80 ">
        <div className="flex items-start gap-3 border-b border-blue-200/60 bg-blue-600/95 px-6 py-5 text-white">
          <ExclamationCircleIcon className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
              Unable to identify
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Could not identify a breed from this image.
            </h2>
            <p className="mt-2 text-sm text-blue-100/90">
              Please upload a clear photo of a single animal, ideally with the
              full body or face visible.
            </p>
          </div>
        </div>
        <div className="space-y-2 px-6 py-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">
            Tips for a better result:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Make sure the animal is clearly in frame.</li>
            <li>Use good lighting — avoid shadows or flash glare.</li>
            <li>Avoid blurry or low-resolution photos.</li>
          </ul>
        </div>
      </div>
    )
  }

  const sizeColor = SIZE_COLORS[result.size] ?? SIZE_COLORS['medium']

  return (
    <div className="animate-rise-in overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-br from-blue-800 via-blue-700 to-blue-600 px-7 py-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start">
          {previewUrl && (
            <div className="shrink-0">
              <img
                src={previewUrl}
                alt="Identified pet"
                className="h-28 w-28 rounded-2xl border-2 border-white/30 object-cover shadow-lg sm:h-32 sm:w-32"
              />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap justify-between items-center">
              <div className="space-x-2">
                <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-white">
                  {result.animal_type}
                </span>

                <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-white">
                  {result.size}
                </span>
              </div>

              <ConfidenceBadge value={result.confidence} />
            </div>
            <h2 className="text-[28px] font-bold leading-tight text-white">
              {result.breed_name}
            </h2>
            <p className="max-w-2xl text-[14px] leading-relaxed text-blue-100">
              {result.description}
            </p>
            {result.origin && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-blue-200" />
                {result.origin}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-6 px-7 py-7">
        {/* Temperament */}
        {result.temperament.length > 0 && (
          <>
            <div>
              <div className="mb-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
