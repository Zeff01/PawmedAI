import * as React from 'react'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentIcon,
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { CameraModal } from './CameraModal'

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
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_6px_rgba(15,28,63,0.06)]">
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
  onFile: (file: File) => void
  previewUrl: string | null
  maxSizeMb?: number
  onValidationError?: (message: string) => void
  onRequestOpen?: (open: () => void) => void
}

export function ImageUpload({
  onFile,
  previewUrl,
  maxSizeMb = 5,
  onValidationError,
  onRequestOpen,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [cameraOpen, setCameraOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const validateAndEmit = React.useCallback(
    (file: File) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        onValidationError?.('Only JPEG, PNG, or WEBP images are supported.')
        return
      }
      const maxBytes = maxSizeMb * 1024 * 1024
      if (file.size > maxBytes) {
        onValidationError?.(
          `Please upload an image smaller than ${maxSizeMb}MB.`,
        )
        return
      }
      onFile(file)
    },
    [maxSizeMb, onFile, onValidationError],
  )

  const openFileDialog = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  React.useEffect(() => {
    onRequestOpen?.(openFileDialog)
  }, [onRequestOpen, openFileDialog])

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndEmit(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndEmit(file)
    e.target.value = ''
  }

  const handleOpenCamera = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCameraOpen(true)
  }

  const handleOpenBrowse = (e: React.MouseEvent) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  return (
    <>
      {cameraOpen && (
        <CameraModal
          onCapture={validateAndEmit}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
          previewUrl
            ? 'border-transparent bg-transparent shadow-none'
            : dragActive
              ? 'border-blue-500 bg-blue-50/60 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]'
              : 'border-slate-200 bg-linear-to-br from-slate-50 to-blue-50/30 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-[0_4px_20px_rgba(37,99,235,0.08)]'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />

        {previewUrl ? (
          <div className="w-full space-y-3">
            <div className="group relative h-80 w-full overflow-hidden rounded-xl">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-70"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-blue-700 shadow-[0_8px_20px_rgba(15,28,63,0.12)]">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  Click to upload new photo
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-57.5 flex-col items-center justify-center gap-3 px-8 py-10 text-center">
            <div
              className={`flex p-3 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-700 text-white transition-transform duration-200 ${
                dragActive ? 'scale-110' : ''
              }`}
            >
              <ArrowUpTrayIcon className="w-5" />
            </div>

            <div>
              <p className="text-[13px] font-bold text-slate-700">
                {dragActive ? 'Release to upload' : 'Drop an image here'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                PNG, JPG, or WEBP · Max 5 MB
              </p>
            </div>

            <div className="mt-1 flex flex-col md:flex-row items-center gap-2">
              <button
                type="button"
                onClick={handleOpenBrowse}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-blue-600 shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
              >
                <DocumentIcon className="h-3.5 w-3.5" />
                Browse files
              </button>

              <button
                type="button"
                onClick={handleOpenCamera}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                <CameraIcon className="h-3.5 w-3.5" />
                Use camera
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
