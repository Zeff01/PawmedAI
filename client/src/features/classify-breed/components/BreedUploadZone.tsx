import {
  CheckCircleIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'

import { UploadCareComponent } from '@/components/UploadCareComponent'
import type { UploadedFile } from '@/components/UploadCareComponent'
import { formatBytes } from '@/utils/format-bytes'

const MAX_SIZE_MB = 5

const SHOT_TIPS = ['Good lighting', 'One animal only', 'Face in frame']

type BreedUploadZoneProps = {
  file: UploadedFile | null
  onUpload: (file: UploadedFile) => void
  onRemove: () => void
}

/**
 * Attach the photo a breed is identified from.
 *
 * Choosing, dragging and the camera belong to the Uploadcare widget; what stays
 * here is the attached-photo card, because seeing the shot that will be sent —
 * and being able to swap it — is the whole point of the step.
 */
export function BreedUploadZone({
  file,
  onUpload,
  onRemove,
}: BreedUploadZoneProps) {
  /* ── A photo is attached ──────────────────────────────────────────────── */
  if (file) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="relative bg-slate-100">
          <img
            src={file.url}
            alt={`Preview of ${file.name}`}
            className="h-56 w-full object-cover sm:h-72"
          />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
            <PhotoIcon className="h-3.5 w-3.5 text-blue-600" />
            Photo attached
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-slate-700">
              {file.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
              {formatBytes(file.size)} · ready to identify
            </p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:outline-none"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>
    )
  }

  /* ── Empty state ──────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
        <PhotoIcon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-[14px] font-extrabold text-slate-800">
          Upload a photo
        </p>
        <p className="mt-0.5 text-[12px] text-slate-500">
          PNG, JPG, or WEBP · up to {MAX_SIZE_MB} MB
        </p>
      </div>

      <UploadCareComponent
        imgOnly
        sourceList="local, camera, url"
        maxSizeMb={MAX_SIZE_MB}
        onUploadOne={onUpload}
      />

      <ul className="flex flex-wrap items-center justify-center gap-2">
        {SHOT_TIPS.map((tip) => (
          <li
            key={tip}
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500"
          >
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}
