import * as React from 'react'
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CameraIcon,
  CheckCircleIcon,
  FolderOpenIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { CameraModal } from '@/features/classify-dss/components/CameraModal'
import { formatBytes } from '@/utils/format-bytes'

const FILE_INPUT_ID = 'breed-photo-input'
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

const SHOT_TIPS = ['Good lighting', 'One animal only', 'Face in frame']

export type UploadStatus = 'idle' | 'uploading' | 'done'

type BreedUploadZoneProps = {
  file: File | null
  previewUrl: string | null
  status: UploadStatus
  progress: number
  onFile: (file: File) => void
  onRemove: () => void
  onValidationError: (message: string) => void
}

export function BreedUploadZone({
  file,
  previewUrl,
  status,
  progress,
  onFile,
  onRemove,
  onValidationError,
}: BreedUploadZoneProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [cameraOpen, setCameraOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const validate = React.useCallback(
    (candidate: File) => {
      if (!ACCEPTED_TYPES.includes(candidate.type)) {
        onValidationError('Only JPEG, PNG, or WEBP images are supported.')
        return
      }
      if (candidate.size > MAX_BYTES) {
        onValidationError('Please choose an image smaller than 5 MB.')
        return
      }
      onFile(candidate)
    },
    [onFile, onValidationError],
  )

  const hiddenInput = (
    <input
      ref={inputRef}
      id={FILE_INPUT_ID}
      type="file"
      accept={ACCEPTED_TYPES.join(',')}
      className="sr-only"
      onChange={(event) => {
        const picked = event.target.files?.[0]
        if (picked) validate(picked)
        event.target.value = ''
      }}
    />
  )

  const camera = cameraOpen ? (
    <CameraModal onCapture={validate} onClose={() => setCameraOpen(false)} />
  ) : null

  /* ── Photo chosen: preview + explicit replace / remove controls ────────── */
  if (previewUrl && file) {
    return (
      <>
        {camera}
        {hiddenInput}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="relative bg-slate-100">
            <img
              src={previewUrl}
              alt={`Preview of ${file.name}`}
              className="h-56 w-full object-cover sm:h-72"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
              <PhotoIcon className="h-3.5 w-3.5 text-blue-600" />
              Photo attached
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-slate-700">
                {file.name}
              </p>
              {status === 'uploading' ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600">
                    Preparing {progress}%
                  </span>
                </div>
              ) : (
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                  {formatBytes(file.size)} · ready to identify
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:outline-none"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  /* ── Empty state ──────────────────────────────────────────────────────── */
  return (
    <>
      {camera}
      <div
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('button')) return
          inputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          const dropped = event.dataTransfer.files.item(0)
          if (dropped) validate(dropped)
        }}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors duration-200 sm:py-10 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40'
        }`}
      >
        {hiddenInput}

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm transition-transform duration-200 ${
            dragActive ? 'scale-110' : 'group-hover:-translate-y-0.5'
          }`}
        >
          <ArrowUpTrayIcon className="h-6 w-6" />
        </div>

        <div>
          <p className="text-[15.5px] font-extrabold text-slate-800">
            {dragActive ? 'Drop to attach' : 'Drag a photo here'}
          </p>
          <p className="mt-1 text-[12.5px] text-slate-500">
            JPG, PNG, or WEBP · up to 5 MB
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-[13px] font-bold text-white transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
          >
            <FolderOpenIcon className="h-4 w-4" />
            Browse files
          </button>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none sm:w-auto"
          >
            <CameraIcon className="h-4 w-4" />
            Take a photo
          </button>
        </div>

        <ul className="flex flex-wrap justify-center gap-1.5">
          {SHOT_TIPS.map((tip) => (
            <li
              key={tip}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-semibold text-slate-500"
            >
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
