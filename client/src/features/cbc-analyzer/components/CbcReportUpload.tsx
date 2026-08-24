import * as React from 'react'
import {
  ArrowPathIcon,
  CameraIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { CameraModal } from '@/features/classify-dss/components/CameraModal'
import { formatBytes } from '@/utils/format-bytes'
import { ACCEPTED_REPORT_TYPES, MAX_REPORT_MB } from '../constants'

const FILE_INPUT_ID = 'cbc-report-input'

export type ReportUploadStatus = 'idle' | 'reading' | 'ready'

type CbcReportUploadProps = {
  file: File | null
  previewUrl: string | null
  status: ReportUploadStatus
  progress: number
  onFile: (file: File) => void
  onRemove: () => void
  onValidationError: (message: string) => void
}

export function CbcReportUpload({
  file,
  previewUrl,
  status,
  progress,
  onFile,
  onRemove,
  onValidationError,
}: CbcReportUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [cameraOpen, setCameraOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const validate = React.useCallback(
    (candidate: File) => {
      if (!ACCEPTED_REPORT_TYPES.includes(candidate.type)) {
        onValidationError('Only JPEG, PNG, or WEBP images are supported.')
        return
      }
      if (candidate.size > MAX_REPORT_MB * 1024 * 1024) {
        onValidationError(
          `Please choose a report image smaller than ${MAX_REPORT_MB} MB.`,
        )
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
      accept={ACCEPTED_REPORT_TYPES.join(',')}
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

  /* ── A report is attached ─────────────────────────────────────────────── */
  if (file && previewUrl) {
    return (
      <>
        {camera}
        {hiddenInput}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="relative max-h-72 overflow-hidden bg-slate-100">
            <img
              src={previewUrl}
              alt={`Preview of ${file.name}`}
              className="h-full max-h-72 w-full object-contain"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <DocumentTextIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12px] font-semibold text-slate-700">
                  {file.name}
                </p>
                {status === 'ready' ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Ready
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] font-bold tabular-nums text-blue-600">
                    {progress}%
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    status === 'ready' ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${status === 'ready' ? 100 : progress}%` }}
                />
              </div>
              <p className="mt-1 text-[10.5px] text-slate-400">
                {formatBytes(file.size)} ·{' '}
                {status === 'ready'
                  ? 'ready to be read'
                  : 'preparing the image…'}
              </p>
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
                aria-label="Remove the report image"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:outline-none"
              >
                <TrashIcon className="h-3.5 w-3.5" />
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
        className={`group flex cursor-pointer flex-col items-center justify-center gap-3.5 rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40'
        }`}
      >
        {hiddenInput}

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white transition-transform duration-200 ${
            dragActive ? 'scale-110' : 'group-hover:-translate-y-0.5'
          }`}
        >
          <DocumentTextIcon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[14px] font-extrabold text-slate-800">
            {dragActive ? 'Drop to attach' : 'Upload CBC report'}
          </p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            PNG, JPG, or WEBP · up to {MAX_REPORT_MB} MB
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-[12.5px] font-bold text-white transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
          >
            <FolderOpenIcon className="h-4 w-4" />
            Choose file
          </button>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[12.5px] font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none sm:w-auto"
          >
            <CameraIcon className="h-4 w-4" />
            Use camera
          </button>
        </div>

        <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
          We read the printed values off the report. Check them against the
          paper before you rely on the brief.
        </p>
      </div>
    </>
  )
}
