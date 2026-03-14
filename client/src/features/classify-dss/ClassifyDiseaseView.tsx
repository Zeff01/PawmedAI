import * as React from 'react'
import { useClassifyDisease } from '#/features/classify-dss/hooks/useClassifyDisease'
import { ImageUpload, UploadProgress } from './components/ImageUpload'
import { ResultsSection } from './components/ResultsSection'
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid'
import { Button } from '#/components/ui/button'
import { formatBytes } from '#/utils/format-bytes'

export function ClassifyDiseaseView() {
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [localError, setLocalError] = React.useState<string | null>(null)

  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadStatus, setUploadStatus] = React.useState<
    'idle' | 'uploading' | 'done' | 'error'
  >('idle')
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const [openFileDialog, setOpenFileDialog] = React.useState<
    (() => void) | null
  >(null)

  const classifyMutation = useClassifyDisease()

  React.useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const handleFile = React.useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setLocalError('Please upload a valid image file (PNG, JPG, or WEBP).')
      return
    }
    setLocalError(null)
    setImageFile(file)
    classifyMutation.reset()

    setUploadProgress(0) // Simulate upload progress
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
  }, [])

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
    if (!imageFile || uploadStatus !== 'done') return
    classifyMutation.mutate(imageFile)
  }

  const errorMessage = localError ?? classifyMutation.error?.message ?? null

  return (
    <main className="relative z-10 min-h-screen pb-24">
      <div className="page-wrap flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* ── Upload card ── */}
          <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_2px_20px_rgba(15,28,63,0.07)]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-blue-50/60 px-6 py-4">
              <div>
                <p className="text-[14px] font-bold text-slate-800">
                  Upload Patient Image
                </p>
                <p className="text-[12px] text-slate-400">
                  Drag & drop or click to browse
                </p>
              </div>
            </div>

            <div className="p-6 space-y-8">
              <ImageUpload
                onFile={handleFile}
                previewUrl={previewUrl}
                maxSizeMb={5}
                onValidationError={(message) => setLocalError(message)}
                onRequestOpen={(open) => setOpenFileDialog(() => open)}
              />

              {/* progress bar */}
              {imageFile && uploadStatus !== 'idle' && (
                <UploadProgress
                  fileName={imageFile.name}
                  fileSize={formatBytes(imageFile.size)}
                  progress={uploadProgress}
                  status={uploadStatus as 'uploading' | 'done' | 'error'}
                  onRemove={handleRemove}
                />
              )}

              {errorMessage ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>
                    You only have 3 tries per day. You can try again after 10
                    hours.
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheckIcon className="h-4 w-4" /> Your image is analyzed
                  securely and never stored.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openFileDialog?.()}
                    disabled={!imageFile}
                    className="inline-flex items-center gap-2 rounded-md border-blue-200 px-4 py-5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    Reupload Photo
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    variant="default"
                    disabled={
                      uploadStatus !== 'done' || classifyMutation.isPending
                    }
                    className="inline-flex items-center gap-2 rounded-md hover:bg-linear-to-b from-blue-500 to-blue-700 px-5 py-5 text-xs font-bold text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {classifyMutation.isPending ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />{' '}
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="h-4 w-4" /> Classify
                        Image
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-blue-200/70 bg-blue-50 p-5 shadow-[0_2px_20px_rgba(15,28,63,0.06)]">
              <div className="mb-1 flex items-center gap-1.5">
                <QuestionMarkCircleIcon className="h-4 w-4 text-blue-500" />
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600">
                  What you will get
                </p>
              </div>
              <h2 className="mt-1 text-[15px] font-bold text-slate-900">
                A structured clinical brief
              </h2>
              <div className="mt-4 space-y-2.5">
                {[
                  'Disease name and short summary',
                  'Clinical diagnosis narrative',
                  'Possible causes and symptoms',
                  'Treatment guidance and notes',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                      <CheckCircleIcon className="h-2.5 w-2.5" />
                    </span>
                    <span className="text-[12.5px] text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 grid-cols-1">
              {[
                [
                  'What this means',
                  'This is an AI suggestion, not a final diagnosis.',
                ],
                [
                  'When to see a vet',
                  'If your pet is in pain, not eating, or the skin worsens.',
                ],
                ['Time to results', 'Usually under 15 seconds.'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={`${label.includes('What this means') ? 'bg-yellow-100 border-yellow-200' : 'bg-white border-slate-200/70'} rounded-lg border  px-4 py-3 shadow-[0_1px_6px_rgba(15,28,63,0.05)]`}
                >
                  <p
                    className={`${label.includes('What this means') ? 'text-yellow-600 flex items-center gap-1' : 'text-blue-500'} text-[10px] font-bold uppercase tracking-wider`}
                  >
                    {label.includes('What this means') ? (
                      <>
                        <ExclamationTriangleIcon className="h-3 w-3" /> {label}
                      </>
                    ) : (
                      label
                    )}
                  </p>
                  <p className="mt-1 text-[12.5px] text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="py-5">
          {classifyMutation.isPending ? (
            <ResultSkeleton />
          ) : classifyMutation.data ? (
            <ResultsSection
              result={classifyMutation.data}
              previewUrl={previewUrl}
            />
          ) : (
            <div className="rounded-lg w-full border border-dashed border-blue-200 bg-blue-50 px-5 py-16 text-center text-[12.5px] text-slate-500">
              Upload an image and run a classification to view the structured
              diagnosis here.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function ResultSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_rgba(15,28,63,0.06)]">
      <div className="h-28 bg-linear-to-br from-blue-200 to-blue-300" />
      <div className="space-y-3 px-7 py-7">
        {[100, 80, 60, 90, 70].map((w, i) => (
          <div
            key={i}
            className="animate-shimmer h-3 rounded-full"
            style={{ width: `${w}%`, marginBottom: i === 2 ? 20 : undefined }}
          />
        ))}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {[75, 65, 80, 70].map((w, i) => (
            <div
              key={i}
              className="animate-shimmer h-3 rounded-full"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
