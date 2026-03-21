import * as React from 'react'
import { useClassifyDisease } from '@/features/classify-dss/hooks/useClassifyDisease'
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
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/utils/format-bytes'
import ResultSkeletonLoader from './components/ResultSkeletonLoader'
import { FadeStagger } from '@/components/motion/FadeStagger'
import { FadeChild } from '@/components/motion/FadeChild'
import { FadeIn } from '@/components/motion/FadeIn'
import { UserTypeDialog } from './components/UserTypeDialog'
import { useUserTypeStore, type UserType } from '@/stores/userTypeStore'

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

  const userType = useUserTypeStore((state) => state.userType)
  const openDialog = useUserTypeStore((state) => state.openDialog)
  const prevUserTypeRef = React.useRef<UserType | null>(null)

  const classifyMutation = useClassifyDisease()

  React.useEffect(() => {
    openDialog()
  }, [openDialog])

  React.useEffect(() => {
    if (prevUserTypeRef.current && userType !== prevUserTypeRef.current) {
      classifyMutation.reset()
      setLocalError(null)
    }
    prevUserTypeRef.current = userType
  }, [userType, classifyMutation])

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
    if (!userType) {
      openDialog()
      return
    }
    if (!imageFile || uploadStatus !== 'done') return
    classifyMutation.mutate(imageFile)
  }

  const errorMessage = localError ?? classifyMutation.error?.message ?? null

  return (
    <section className="relative z-10 min-h-screen pb-24">
      <UserTypeDialog />
      <div className="page-wrap flex flex-col gap-6">
        <FadeStagger
          trigger="mount"
          className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]"
        >
          {/* ── Upload card ── */}
          <FadeChild direction="up">
            <section
              className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_2px_20px_rgba(15,28,63,0.07)]"
              aria-labelledby="upload-card-title"
            >
              <header className="flex flex-col gap-3 border-b border-slate-100 bg-blue-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="upload-card-title" className="text-[14px] font-bold text-slate-800">
                    Upload Patient Image
                  </h2>
                  <p className="text-[12px] text-slate-400">
                    Drag & drop or click to browse
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    {userType
                      ? userType === 'professional'
                        ? 'Veterinary professional'
                        : 'Veterinary student'
                      : 'Select profile'}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openDialog}
                    className="h-8 rounded-full border-blue-200 px-3 text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    Switch
                  </Button>
                </div>
              </header>

              <div className="p-6 space-y-8">
                <ImageUpload
                  onFile={handleFile}
                  previewUrl={previewUrl}
                  maxSizeMb={5}
                  onValidationError={(message) => setLocalError(message)}
                  onRequestOpen={(open) => setOpenFileDialog(() => open)}
                />

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
                    <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
                    <ExclamationTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      You only have 3 tries per day. You can try again after 10
                      hours.
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheckIcon className="h-4 w-4 shrink-0" /> Your image
                    is analyzed securely and never stored.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openFileDialog?.()}
                      disabled={!imageFile}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md border-blue-200 px-4 py-5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md hover:bg-linear-to-b from-blue-500 to-blue-700 px-5 py-5 text-xs font-bold text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
            </section>
          </FadeChild>

          {/* ── Right panel ── */}
          <FadeChild direction="up" duration={0.6}>
            <aside className="flex flex-col gap-5">
              <section
                className="rounded-xl border border-blue-200/70 bg-blue-50 p-5 shadow-[0_2px_20px_rgba(15,28,63,0.06)]"
                aria-labelledby="benefits-title"
              >
                <header className="mb-1 flex items-center gap-1.5">
                  <QuestionMarkCircleIcon className="h-4 w-4 text-blue-500" />
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600">
                    What you will get
                  </p>
                </header>
                <h3 id="benefits-title" className="mt-1 text-[15px] font-bold text-slate-900">
                  A structured clinical brief
                </h3>
                <ul className="mt-4 space-y-2.5 list-none p-0 m-0">
                  {[
                    'Disease name and short summary',
                    'Clinical diagnosis narrative',
                    'Possible causes and symptoms',
                    'Treatment guidance and notes',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                        <CheckCircleIcon className="h-2.5 w-2.5" />
                      </span>
                      <span className="text-[12.5px] text-slate-600">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <dl className="grid gap-2 grid-cols-1">
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
                    className={`${label.includes('What this means') ? 'bg-yellow-100 border-yellow-200' : 'bg-white border-slate-200/70'} rounded-lg border px-4 py-3 shadow-[0_1px_6px_rgba(15,28,63,0.05)]`}
                  >
                    <dt
                      className={`${label.includes('What this means') ? 'text-yellow-600 flex items-center gap-1' : 'text-blue-500'} text-[10px] font-bold uppercase tracking-wider`}
                    >
                      {label.includes('What this means') ? (
                        <>
                          <ExclamationTriangleIcon className="h-3 w-3" />{' '}
                          {label}
                        </>
                      ) : (
                        label
                      )}
                    </dt>
                    <dd className="mt-1 text-[12.5px] text-slate-700">{value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </FadeChild>
        </FadeStagger>

        {/* ── Results ── */}
        <FadeIn trigger="mount" delay={0.3} className="py-5">
          {classifyMutation.isPending ? (
            <ResultSkeletonLoader />
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
        </FadeIn>
      </div>
    </section>
  )
}
