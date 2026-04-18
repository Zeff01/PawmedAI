import * as React from 'react'
import { useClassifyBreed } from './hooks/useClassifyBreed'
import { BreedResults } from './components/BreedResults'
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CameraIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/utils/format-bytes'
import { FadeIn } from '@/components/motion/FadeIn'
import { AuthModal } from '@/components/AuthModal'
import { useMe } from '@/hooks/useAuth'
import PawMedLoader from '@/features/classify-dss/components/ResultSkeletonLoader'
import { CameraModal } from '@/features/classify-dss/components/CameraModal'
import { AnimalBreedSidebar } from './components/AnimalBreedSidebar'

/* ── Upload Zone ─────────────────────────────────────────────────────────── */
function BreedUploadZone({
  previewUrl,
  onFile,
  onRemove,
  onValidationError,
}: {
  previewUrl: string | null
  onFile: (file: File) => void
  onRemove: () => void
  onValidationError: (msg: string) => void
}) {
  const [dragActive, setDragActive] = React.useState(false)
  const [cameraOpen, setCameraOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const validate = React.useCallback(
    (file: File) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowed.includes(file.type)) {
        onValidationError('Only JPEG, PNG, or WEBP images are supported.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        onValidationError('Please upload an image smaller than 5 MB.')
        return
      }
      onFile(file)
    },
    [onFile, onValidationError],
  )

  if (previewUrl) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-blue-50/30 shadow-[0_4px_24px_rgba(13,148,136,0.10)]">
        <img
          src={previewUrl}
          alt="Preview"
          className="h-110 w-full object-cover transition-opacity duration-200 group-hover:opacity-60"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="rounded-full bg-white/90 px-4 py-2 text-[12px] font-semibold text-blue-700 shadow">
            Click to change photo
          </span>
        </div>
        {/* Click overlay to re-upload */}
        <button
          type="button"
          className="absolute inset-0 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change photo"
        />
        {/* Remove button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow transition hover:bg-white hover:text-red-500"
          aria-label="Remove photo"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) validate(f)
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <>
      {cameraOpen && (
        <CameraModal
          onCapture={validate}
          onClose={() => setCameraOpen(false)}
        />
      )}
      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50/70 shadow-[0_0_0_4px_rgba(13,148,136,0.12)]'
            : 'border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:bg-blue-50/60'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          const f = e.dataTransfer.files?.[0]
          if (f) validate(f)
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) validate(f)
            e.target.value = ''
          }}
        />

        <div className="flex min-h-64 flex-col items-center justify-center gap-5 px-8 py-12 text-center">
          <div
            className={`flex items-center justify-center rounded-2xl bg-blue-600 p-4 text-white shadow-md transition-transform duration-200 ${dragActive ? 'scale-110' : ''}`}
          >
            <ArrowUpTrayIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-700">
              {dragActive ? 'Release to upload' : 'Drop your pet photo here'}
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              PNG, JPG, or WEBP · Max 5 MB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
            >
              <DocumentIcon className="h-3.5 w-3.5" />
              Browse files
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCameraOpen(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <CameraIcon className="h-3.5 w-3.5" />
              Use camera
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── File info strip ─────────────────────────────────────────────────────── */
function FileStrip({
  file,
  status,
  progress,
}: {
  file: File
  status: 'uploading' | 'done'
  progress: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <DocumentIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-slate-700">
          {file.name}
        </p>
        <p className="text-[11px] text-slate-400">{formatBytes(file.size)}</p>
      </div>
      {status === 'uploading' ? (
        <span className="text-[11px] font-semibold text-blue-600">
          {progress}%
        </span>
      ) : (
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-semibold text-blue-700">
          Ready
        </span>
      )}
    </div>
  )
}

/* ── Main view ───────────────────────────────────────────────────────────── */
export function ClassifyBreedView() {
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadStatus, setUploadStatus] = React.useState<
    'idle' | 'uploading' | 'done'
  >('idle')
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: me } = useMe()
  const classifyMutation = useClassifyBreed()

  React.useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const handleFile = React.useCallback(
    (file: File) => {
      setLocalError(null)
      setImageFile(file)
      classifyMutation.reset()
      setUploadProgress(0)
      setUploadStatus('uploading')
      let current = 0
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        current += Math.random() * (current < 60 ? 12 : current < 85 ? 4 : 8)
        if (current >= 100) {
          setUploadProgress(100)
          setUploadStatus('done')
          clearInterval(timerRef.current!)
        } else {
          setUploadProgress(Math.round(current))
        }
      }, 180)
    },
    [classifyMutation],
  )

  const handleRemove = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setImageFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setUploadStatus('idle')
    setLocalError(null)
    classifyMutation.reset()
  }

  const handleSubmit = () => {
    if (!imageFile) {
      setLocalError('Please upload a photo to identify the breed.')
      return
    }
    if (uploadStatus !== 'done') {
      setLocalError('Please wait for the image to finish uploading.')
      return
    }
    setLocalError(null)
    classifyMutation.mutate({ imageFile })
  }

  const errorMessage = localError ?? classifyMutation.error?.message ?? null
  const canSubmit =
    !classifyMutation.isPending && imageFile !== null && uploadStatus === 'done'

  return (
    <section className="relative z-10 min-h-screen pb-24 mt-12">
      <div className="page-wrap">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <FadeIn trigger="mount" className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-700">
            AI Breed Identifier
          </span>
          <h1 className="mt-3 text-[28px] font-extrabold leading-tight text-slate-900 sm:text-[32px]">
            What breed is your pet?
          </h1>
          <p className="mt-2 text-[14px] text-slate-500">
            Upload a clear photo and our AI will identify the breed in seconds.
          </p>
        </FadeIn>

        {/* ── Two-column layout ───────────────────────────────────────── */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          {/* Main column */}
          <div>
            {/* ── Upload panel ──────────────────────────────────────── */}
            <FadeIn trigger="mount" delay={0.1}>
              <BreedUploadZone
                previewUrl={previewUrl}
                onFile={handleFile}
                onRemove={handleRemove}
                onValidationError={setLocalError}
              />

              {/* File strip */}
              {imageFile && uploadStatus !== 'idle' && (
                <div className="mt-3">
                  <FileStrip
                    file={imageFile}
                    status={uploadStatus as 'uploading' | 'done'}
                    progress={uploadProgress}
                  />
                </div>
              )}

              {/* Error / info banner */}
              <div className="mt-3">
                {errorMessage ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700">
                    <div className="flex items-start gap-2">
                      <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    {(() => {
                      const err = classifyMutation.error as Error & {
                        code?: string
                        isAuthed?: boolean
                      }
                      if (err?.code === 'THROTTLE' && !err?.isAuthed) {
                        return (
                          <AuthModal
                            trigger={
                              <Button
                                type="button"
                                size="sm"
                                className="w-fit rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                              >
                                Sign in for more free identifications
                              </Button>
                            }
                          />
                        )
                      }
                      return null
                    })()}
                  </div>
                ) : (
                  <p className="text-center text-[11.5px] text-slate-400">
                    {me
                      ? '5 identifications per 5 hours.'
                      : '3 free identifications · Sign in for 5 per 5 hours.'}
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="mt-5 flex flex-col items-center gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full max-w-xs rounded-xl bg-blue-600 py-5 text-[13px] font-bold text-white shadow-md transition-all duration-150 hover:bg-blue-700 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {classifyMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Identifying breed…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      Identify Breed
                    </span>
                  )}
                </Button>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  Photo is never stored or shared.
                </p>
              </div>
            </FadeIn>

            {/* ── Results ───────────────────────────────────────────── */}
            <FadeIn trigger="mount" delay={0.2} className="mt-10">
              {classifyMutation.isPending ? (
                <PawMedLoader />
              ) : classifyMutation.data ? (
                <BreedResults
                  result={classifyMutation.data}
                  previewUrl={previewUrl}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-14 text-center text-[13px] text-slate-400">
                  Your breed profile will appear here after identification.
                </div>
              )}
            </FadeIn>
          </div>

          {/* Sidebar column */}
          <FadeIn trigger="mount" delay={0.15}>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm">
              <AnimalBreedSidebar />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export default ClassifyBreedView
