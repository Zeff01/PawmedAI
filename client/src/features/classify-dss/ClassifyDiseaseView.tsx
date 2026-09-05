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
import { useUserTypeStore } from '@/stores/userTypeStore'
import type { UserType } from '@/types/auth'
import { showLocalNotification } from '@/pwa/push'
import { useAuthGate } from '@/hooks/useAuthGate'
import { useUserType } from '@/hooks/useUserType'
import { AuthModal } from '@/components/AuthModal'

/** Mirrors the step badge on the breed identifier: filled once the step has
    something in it, so the two inputs read as progress rather than a form. */
function StepBadge({ n, filled }: { n: number; filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition-colors ${
        filled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
      }`}
    >
      {n}
    </span>
  )
}

/**
 * One labelled input step. The label row carries the title, the helper text
 * and the state, so each input no longer needs a caption stack beneath it.
 */
function InputStep({
  n,
  title,
  hint,
  status,
  filled,
  className = 'px-5 py-5 sm:px-6',
  children,
}: {
  n: number
  title: string
  hint: string
  status: string
  filled: boolean
  /** Padding for the step — a flush layout drops the outer side. */
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="mb-3 flex items-start gap-2.5">
        <StepBadge n={n} filled={filled} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3">
            <h3 className="text-[13px] font-extrabold text-slate-900">
              {title}
            </h3>
            <span
              className={`text-[10.5px] font-bold uppercase tracking-wider ${
                filled ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {status}
            </span>
          </div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
            {hint}
          </p>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function ClassifyDiseaseView() {
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const [textInput, setTextInput] = React.useState('')
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadStatus, setUploadStatus] = React.useState<
    'idle' | 'uploading' | 'done' | 'error'
  >('idle')
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const [openFileDialog, setOpenFileDialog] = React.useState<
    (() => void) | null
  >(null)
  const lastResultRef = React.useRef<unknown>(null)

  const userType = useUserTypeStore((state) => state.userType)
  const openDialog = useUserTypeStore((state) => state.openDialog)
  const lockSelection = useUserTypeStore((state) => state.lockSelection)
  const setUserType = useUserTypeStore((state) => state.setUserType)
  const setLockSelection = useUserTypeStore((state) => state.setLockSelection)
  const prevUserTypeRef = React.useRef<UserType | null>(null)
  const {
    isAuthenticated,
    isSessionLoading,
    isAuthPromptOpen,
    setAuthPromptOpen,
    handleAuthenticated,
    runWhenSignedIn,
  } = useAuthGate()
  // Professionals get a denser, single-card layout: the owner-facing rail
  // explains a clinical brief to people who write them for a living.
  const { isProfessional } = useUserType()

  const classifyMutation = useClassifyDisease()

  React.useEffect(() => {
    if (prevUserTypeRef.current && userType !== prevUserTypeRef.current) {
      classifyMutation.reset()
      setLocalError(null)
    }
    prevUserTypeRef.current = userType
  }, [userType, classifyMutation])

  React.useEffect(() => {
    if (isSessionLoading) return
    if (!isAuthenticated) {
      setLockSelection(true)
      setUserType('fur_parent')
      return () => {
        setLockSelection(false)
      }
    }
  }, [isSessionLoading, isAuthenticated, setLockSelection, setUserType])

  React.useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  React.useEffect(() => {
    if (!classifyMutation.data) return
    if (lastResultRef.current === classifyMutation.data) return
    lastResultRef.current = classifyMutation.data
    showLocalNotification({
      title: 'PawMed AI',
      body: 'Your diagnostic brief is ready.',
      url: '/classify',
    })
  }, [classifyMutation.data])

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

  /** "Start over" clears both inputs — clearing only the photo would leave
      stale notes behind and read as a half-reset. */
  const handleReset = () => {
    handleRemove()
    setTextInput('')
  }

  const handleSubmit = () => {
    if (!userType) {
      openDialog()
      return
    }
    const trimmedText = textInput.trim()
    if (!imageFile && !trimmedText) {
      setLocalError('Please upload an image or add notes to classify.')
      return
    }
    if (imageFile && uploadStatus !== 'done') {
      setLocalError('Please wait for the image to finish uploading.')
      return
    }
    setLocalError(null)
    // A classification spends from an account's allowance, so a visitor gets
    // the sign-in dialog here rather than a refusal from the API.
    runWhenSignedIn(() =>
      classifyMutation.mutate({
        imageFile,
        textInput: trimmedText,
      }),
    )
  }

  const errorMessage = localError ?? classifyMutation.error?.message ?? null
  // A classification spends from an account's allowance, so there is nothing
  // to spend without one.
  const needsAuth = !isSessionLoading && !isAuthenticated
  const trimmedText = textInput.trim()
  const hasAnyInput = Boolean(imageFile) || trimmedText.length > 0
  const canSubmit =
    !classifyMutation.isPending &&
    ((imageFile && uploadStatus === 'done') || trimmedText.length > 0)

  return (
    <section className="relative z-10 min-h-screen pb-24">
      <div className="page-wrap flex flex-col gap-6">
        <FadeStagger
          trigger="mount"
          className={
            isProfessional
              ? 'grid gap-6'
              : 'grid gap-6 lg:grid-cols-[1.3fr_0.7fr]'
          }
        >
          {/* ── Upload card ── */}
          <FadeChild direction="up">
            {/* The professional shell already frames this space, so the card
                border would be a box inside a box — the hairlines alone carry
                the structure. */}
            <section
              className={
                isProfessional
                  ? 'bg-white'
                  : 'overflow-hidden rounded-lg border border-slate-200 bg-white'
              }
              aria-labelledby="upload-card-title"
            >
              <header
                className={`flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between ${
                  isProfessional ? 'pb-4' : 'bg-slate-50/70 px-5 py-3.5 sm:px-6'
                }`}
              >
                <div>
                  <h2
                    id="upload-card-title"
                    className="text-[13.5px] font-extrabold text-slate-900"
                  >
                    New analysis
                  </h2>
                  <p className="text-[11.5px] text-slate-500">
                    {isProfessional
                      ? 'Attach an image, dictate the presenting signs, or both'
                      : 'A photo, clinical notes, or both — either one is enough'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* The professional shell already shows the workspace and the
                      signed-in role, so the badge is chrome repeated. */}
                  {!isProfessional && (
                    <span className="rounded-full border border-blue-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                      {userType
                        ? userType === 'professional'
                          ? 'Veterinary professional'
                          : userType === 'student'
                            ? 'Veterinary student'
                            : 'Fur Parent'
                        : 'Select profile'}
                    </span>
                  )}
                  {isAuthenticated && !lockSelection ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openDialog}
                      className="h-8 rounded-full border-blue-200 px-3 text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      Switch
                    </Button>
                  ) : null}
                </div>
              </header>

              {/* Two labelled steps rather than an unlabelled stack, so it is
                  clear what each input contributes and that either is enough.
                  Side by side for professionals: both inputs stay in view, and
                  notes are a peer of the image rather than a footer to it. */}
              <div className="divide-y divide-slate-100">
                <div
                  className={
                    isProfessional
                      ? 'grid divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0'
                      : 'grid divide-y divide-slate-100'
                  }
                >
                  <InputStep
                    n={1}
                    className={
                      isProfessional ? 'py-5 lg:pr-6' : 'px-5 py-5 sm:px-6'
                    }
                    title={isProfessional ? 'Patient image' : 'Patient photo'}
                    hint={
                      isProfessional
                        ? 'Lesion, site, or dermatoscopic view — even lighting, in focus.'
                        : 'A clear, well-lit shot of the affected area works best.'
                    }
                    status={
                      imageFile
                        ? 'Added'
                        : trimmedText.length > 0
                          ? 'Optional'
                          : 'Recommended'
                    }
                    filled={Boolean(imageFile)}
                  >
                    <div
                      className={
                        isProfessional
                          ? 'flex h-full flex-col gap-3'
                          : 'space-y-3'
                      }
                    >
                      <ImageUpload
                        onFile={handleFile}
                        previewUrl={previewUrl}
                        maxSizeMb={5}
                        className={isProfessional ? 'min-h-0 flex-1' : ''}
                        onValidationError={(message) => setLocalError(message)}
                        onRequestOpen={(open) => setOpenFileDialog(() => open)}
                      />

                      {imageFile && uploadStatus !== 'idle' && (
                        <UploadProgress
                          fileName={imageFile.name}
                          fileSize={formatBytes(imageFile.size)}
                          progress={uploadProgress}
                          status={uploadStatus}
                          onRemove={handleRemove}
                        />
                      )}

                      {imageFile ? (
                        <button
                          type="button"
                          onClick={() => openFileDialog?.()}
                          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 transition hover:text-blue-700"
                        >
                          <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                          {isProfessional
                            ? 'Replace image'
                            : 'Replace this photo'}
                        </button>
                      ) : null}
                    </div>
                  </InputStep>

                  <InputStep
                    n={2}
                    className={
                      isProfessional ? 'py-5 lg:pl-6' : 'px-5 py-5 sm:px-6'
                    }
                    title={
                      isProfessional
                        ? 'History and signalment'
                        : 'Clinical notes'
                    }
                    hint={
                      isProfessional
                        ? 'Presenting signs, onset and duration, prior treatment, species and age.'
                        : 'Symptoms, duration and history — they sharpen the read.'
                    }
                    status={
                      trimmedText.length > 0
                        ? `${textInput.length}/2000`
                        : imageFile
                          ? 'Optional'
                          : 'Required without a photo'
                    }
                    filled={trimmedText.length > 0}
                  >
                    <label htmlFor="clinical-notes" className="sr-only">
                      Clinical notes
                    </label>
                    <textarea
                      id="clinical-notes"
                      name="clinical-notes"
                      rows={4}
                      maxLength={2000}
                      value={textInput}
                      onChange={(event) => setTextInput(event.target.value)}
                      placeholder={
                        isProfessional
                          ? 'Example: 3yo MN DSH, bilateral pinnal pruritus and alopecia, 3 weeks, no response to topical miconazole…'
                          : 'Example: itchy, hair loss around ears, red patches on belly, 3 days duration…'
                      }
                      className={`w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${
                        isProfessional ? 'h-full min-h-52' : ''
                      }`}
                    />
                  </InputStep>
                </div>

                {/* Sign-in requirement surfaced before the user commits */}
                {needsAuth && !errorMessage ? (
                  <div
                    className={`flex flex-wrap items-center gap-3 border-t border-amber-200 bg-amber-50 text-[12.5px] ${
                      isProfessional ? 'px-4 py-3' : 'px-5 py-3 sm:px-6'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold text-amber-900">
                        Classifying needs an account
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber-800">
                        Every classification comes out of your allowance — 5
                        analyses every 5 hours, shared across every AI feature.
                        Sign in and your photo and notes are still here.
                      </p>
                    </div>
                    <AuthModal
                      onAuthenticated={handleAuthenticated}
                      trigger={
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-lg bg-amber-600 px-3 text-[11.5px] font-bold text-white hover:bg-amber-700"
                        >
                          Sign in
                        </Button>
                      }
                    />
                  </div>
                ) : null}

                <AuthModal
                  open={isAuthPromptOpen}
                  onOpenChange={setAuthPromptOpen}
                  notice="Classifying needs an account — each run spends from your analyses allowance. Sign in to continue."
                  onAuthenticated={handleAuthenticated}
                />

                {errorMessage ? (
                  <div
                    role="alert"
                    className={`flex flex-col gap-2 text-[12.5px] text-red-700 ${
                      isProfessional ? 'py-4' : 'bg-red-50 px-5 py-4 sm:px-6'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    {(() => {
                      const err = classifyMutation.error as
                        | (Error & { code?: string })
                        | null
                      if (err?.code === 'UNAUTHENTICATED') {
                        return (
                          <AuthModal
                            onAuthenticated={handleAuthenticated}
                            trigger={
                              <Button
                                type="button"
                                size="sm"
                                className="w-fit rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                              >
                                Sign in to classify
                              </Button>
                            }
                          />
                        )
                      }
                      return null
                    })()}
                  </div>
                ) : null}

                {/* Action bar — tinted like the header, so the two inputs sit
                    between a frame top and bottom. The readiness line answers
                    "why can I not run this yet?" instead of leaving a dead
                    button, and the meta facts are footnotes, not warnings. */}
                <div
                  className={
                    isProfessional
                      ? 'pt-4 pb-1'
                      : 'bg-slate-50/70 px-5 py-4 sm:px-6'
                  }
                >
                  <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      {hasAnyInput && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleReset}
                          className="h-11 rounded-lg px-4 text-[12.5px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          Start over
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={classifyMutation.isPending}
                        className={`h-11 rounded-lg px-6 text-[13px] font-bold text-white transition disabled:cursor-not-allowed ${
                          canSubmit
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-blue-600/70 hover:bg-blue-600'
                        }`}
                      >
                        {classifyMutation.isPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            Analyzing…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <MagnifyingGlassIcon className="h-4 w-4" />
                            {classifyMutation.data
                              ? 'Classify again'
                              : 'Classify'}
                          </span>
                        )}
                      </Button>
                    </div>

                    <p className="text-[11.5px] leading-relaxed text-slate-500">
                      {canSubmit ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Ready to classify
                        </span>
                      ) : imageFile && uploadStatus !== 'done' ? (
                        'Waiting for the photo to finish uploading…'
                      ) : (
                        'Add a photo or clinical notes to continue.'
                      )}
                    </p>
                  </div>

                  {/* The professional shell carries the quota badge, so the
                      footnote drops it and states the clinical caveat instead —
                      the one thing a clinician needs on the record. */}
                  <p className="mt-3 flex items-start gap-1.5 border-t border-slate-200/70 pt-3 text-[11px] text-slate-400">
                    <ShieldCheckIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                    {isProfessional
                      ? 'Decision support only — verify against your exam findings. Images are analyzed securely and never stored.'
                      : 'Analyzed securely and never stored · Usually under 15 seconds · 5 classifications every 5 hours'}
                  </p>
                </div>
              </div>
            </section>
          </FadeChild>

          {/* ── Right panel — owner guidance only ── */}
          {!isProfessional && (
            <FadeChild direction="up" duration={0.6}>
              {/* One guidance panel instead of four floating notes: the output,
                the caution, and the escalation advice are all "what to expect",
                so they belong in one frame as bands — and the form is then the
                loudest thing on the page, which is the point of it. */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <section
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                  aria-labelledby="benefits-title"
                >
                  <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                    <QuestionMarkCircleIcon className="h-4 w-4 shrink-0 text-blue-500" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      What to expect
                    </p>
                  </header>

                  <div className="px-5 py-4">
                    <h3
                      id="benefits-title"
                      className="text-[14.5px] font-bold text-slate-900"
                    >
                      A structured clinical brief
                    </h3>
                    <ul className="m-0 mt-3 list-none space-y-2 p-0">
                      {[
                        'Disease name and short summary',
                        'Clinical diagnosis narrative',
                        'Possible causes and symptoms',
                        'Treatment guidance and notes',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          {/* The icon is the marker — it does not need a tinted
                            chip around it as well. */}
                          <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                          <span className="text-[12.5px] leading-relaxed text-slate-600">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* A tinted band, not a panel nested inside a panel. */}
                  <div className="flex items-start gap-2.5 border-y border-amber-200 bg-amber-50 px-5 py-4">
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        What this means
                      </p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-amber-950">
                        This is an AI suggestion, not a final diagnosis.
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      When to see a vet
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
                      If your pet is in pain, not eating, or the skin worsens.
                    </p>
                  </div>
                </section>
              </aside>
            </FadeChild>
          )}
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
            <div className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
              <p className="text-[14px] font-bold text-slate-800">
                {isProfessional
                  ? 'The clinical brief appears here'
                  : 'Your diagnostic brief shows up here'}
              </p>
              <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-500">
                {isProfessional
                  ? 'Differentials, pathophysiology, treatment protocol, and escalation criteria.'
                  : 'Upload a patient image or add clinical notes above, then run the classification.'}
              </p>
            </div>
          )}
        </FadeIn>
      </div>
    </section>
  )
}
