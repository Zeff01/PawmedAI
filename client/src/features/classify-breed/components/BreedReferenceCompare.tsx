import { ArrowTopRightOnSquareIcon, PhotoIcon } from '@heroicons/react/24/solid'
import { useBreedReferencePhoto } from '../hooks/useBreedReferencePhoto'

function PhotoFrame({
  src,
  alt,
  label,
  caption,
}: {
  src: string
  alt: string
  label: string
  caption: string
}) {
  return (
    <figure className="min-w-0 flex-1">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-48 w-full object-cover sm:h-56"
        />
      </div>
      <figcaption className="mt-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-[11.5px] text-slate-400">{caption}</p>
      </figcaption>
    </figure>
  )
}

function CompareSkeleton({ withUserPhoto }: { withUserPhoto: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {withUserPhoto && (
        <div className="min-w-0 flex-1">
          <div className="h-48 w-full animate-pulse rounded-xl bg-slate-100 sm:h-56" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="h-48 w-full animate-pulse rounded-xl bg-slate-100 sm:h-56" />
        <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  )
}

/**
 * Shows a representative photo of the identified breed beside the user's own
 * photo, so they can judge the match for themselves. Renders nothing when no
 * reference photo can be found — an unrelated animal would be worse than none.
 */
export function BreedReferenceCompare({
  breedName,
  animalType,
  previewUrl,
}: {
  breedName: string
  animalType: string
  previewUrl: string | null
}) {
  const { data: reference, isLoading } = useBreedReferencePhoto(
    breedName,
    animalType,
  )

  if (isLoading) {
    return (
      <section className="border-b border-slate-100 px-6 py-5 sm:px-7">
        <CompareSkeleton withUserPhoto={Boolean(previewUrl)} />
      </section>
    )
  }

  if (!reference) return null

  return (
    <section className="border-b border-slate-100 px-6 py-5 sm:px-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PhotoIcon className="h-4 w-4 shrink-0 text-blue-600" />
          <h3 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-600">
            {previewUrl ? 'Compare with the breed' : 'What this breed looks like'}
          </h3>
        </div>
        <a
          href={reference.pageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          Photo via Wikipedia
          <ArrowTopRightOnSquareIcon className="h-3 w-3 shrink-0" />
        </a>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {previewUrl && (
          <PhotoFrame
            src={previewUrl}
            alt="The pet you uploaded"
            label="Your photo"
            caption="The image you submitted."
          />
        )}
        <PhotoFrame
          src={reference.imageUrl}
          alt={`A typical ${reference.title}`}
          label={`Typical ${reference.title}`}
          caption={
            reference.summary ||
            'A representative example of this breed — not your pet.'
          }
        />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        This is a reference photo of the breed, not your animal. Coat colour and
        markings vary between individuals, so treat it as a guide rather than
        confirmation.
      </p>
    </section>
  )
}
