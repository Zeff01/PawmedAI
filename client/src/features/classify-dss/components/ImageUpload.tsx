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
  previewUrl: string | null
  maxSizeMb?: number
  className?: string
}

export function ImageUpload({
  onUpload,
  previewUrl,
  maxSizeMb = 5,
  className = '',
}: ImageUploadProps) {
  return (
    <UploadCareComponent
      headless
      imgOnly
      sourceList="local, camera, url"
      maxSizeMb={maxSizeMb}
      onUploadOne={onUpload}
      zoneClassName={({ dragActive }) =>
        `relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed p-6 transition ${
          previewUrl
            ? 'border-transparent bg-transparent'
            : dragActive
              ? 'border-blue-400 bg-blue-50/60'
              : 'border-slate-300 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40'
        } ${className}`
      }
    >
      {({ dragActive, uploader }) =>
        previewUrl ? (
          <div className="group relative h-80 w-full overflow-hidden rounded-lg border border-slate-200">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-70"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[12px] font-bold text-blue-700">
                <ArrowUpTrayIcon className="h-4 w-4" />
                Click to upload a new photo
              </div>
            </div>
            <div className="absolute right-2 bottom-2">{uploader}</div>
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
            <ArrowUpTrayIcon
              className={`h-6 w-6 transition-transform duration-200 ${
                dragActive ? 'scale-110 text-blue-500' : 'text-slate-300'
              }`}
            />

            <div>
              <p className="text-[13.5px] font-bold text-slate-800">
                {dragActive ? 'Release to upload' : 'Drop an image here'}
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">
                PNG, JPG, or WEBP · Max {maxSizeMb} MB
              </p>
            </div>

            {uploader}
          </div>
        )
      }
    </UploadCareComponent>
  )
}
