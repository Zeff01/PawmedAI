import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { UploadCareComponent } from '@/components/UploadCareComponent'
import type { UploadedFile } from '@/components/UploadCareComponent'

interface UploadProgressProps {
  fileName: string
  fileSize: string
  progress: number
  status: 'uploading' | 'done' | 'error'
  onRemove: () => void
}

export function UploadProgress({
  fileName,
  fileSize,
  progress,
  status,
  onRemove,
}: UploadProgressProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            status === 'error'
              ? 'bg-red-50 text-red-500'
              : status === 'done'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-blue-50 text-blue-600'
          }`}
        >
          <PhotoIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-slate-800">
                {fileName}
              </p>
              <p className="text-[11px] text-slate-400">{fileSize}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {status === 'done' && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  Ready
                </span>
              )}
              {status === 'error' && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-semibold text-red-600">
                  Failed
                </span>
              )}
              {status === 'uploading' && (
                <span className="text-[11px] font-semibold tabular-nums text-blue-600">
                  {progress}%
                </span>
              )}
              <button
                onClick={onRemove}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                status === 'error'
                  ? 'bg-red-400'
                  : status === 'done'
                    ? 'bg-emerald-500'
                    : 'bg-linear-to-r from-blue-500 to-blue-600'
              }`}
              style={{ width: `${status === 'done' ? 100 : progress}%` }}
            />
          </div>

          <p className="mt-1.5 text-[10.5px] text-slate-400">
            {status === 'uploading' && 'Uploading…'}
            {status === 'done' && 'Upload complete — ready to classify'}
            {status === 'error' && 'Upload failed. Please try again.'}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Upload Zone ────────────────────────────────────────── */
interface ImageUploadProps {
  onUpload: (file: UploadedFile) => void
  /** The attached photo's CDN URL, or null while nothing is attached. */
  previewUrl: string | null
  maxSizeMb?: number
  /** Extra classes for the zone itself — used to fill a column. */
  className?: string
}

/**
 * Attach the photo a case is read from.
 *
 * Browsing, dragging and the camera are the Uploadcare widget's job; this keeps
 * the preview, because the reader should see the shot the model will be given.
 * The widget stays on screen once a photo is attached, so replacing one is the
 * same gesture as attaching the first.
 */
export function ImageUpload({
  onUpload,
  previewUrl,
  maxSizeMb = 5,
  className = '',
}: ImageUploadProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed transition ${
        previewUrl
          ? 'border-transparent bg-transparent'
          : 'border-slate-300 bg-slate-50/60'
      } ${className}`}
    >
      {previewUrl ? (
        <div className="relative h-80 w-full overflow-hidden rounded-lg border border-slate-200">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-8 pt-10 text-center">
          <ArrowUpTrayIcon className="h-6 w-6 text-slate-300" />
          <div>
            <p className="text-[13.5px] font-bold text-slate-800">
              Add a photo
            </p>
            <p className="mt-0.5 text-[11.5px] text-slate-400">
              PNG, JPG, or WEBP · Max {maxSizeMb} MB
            </p>
          </div>
        </div>
      )}

      <div className={previewUrl ? 'pb-1' : 'pb-10'}>
        <UploadCareComponent
          imgOnly
          sourceList="local, camera, url"
          maxSizeMb={maxSizeMb}
          onUploadOne={onUpload}
        />
      </div>
    </div>
  )
}
