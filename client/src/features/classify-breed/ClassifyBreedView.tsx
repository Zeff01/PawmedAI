import * as React from 'react'
import { useClassifyBreed } from './hooks/useClassifyBreed'
import { BreedResults } from './components/BreedResults'
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PhotoIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion/FadeIn'
import { AuthModal } from '@/components/AuthModal'
import { useSupabaseSession } from '@/hooks/useAuth'
import { useUserType } from '@/hooks/useUserType'
import { QuotaBadge } from '@/components/QuotaBadge'
import PawMedLoader from '@/features/classify-dss/components/ResultSkeletonLoader'
import { AnimalBreedSidebar } from './components/AnimalBreedSidebar'
import { BreedUploadZone } from './components/BreedUploadZone'
import type { UploadStatus } from './components/BreedUploadZone'
import {
  BreedDescriptionInput,
  MIN_DESCRIPTION_LENGTH,
} from './components/BreedDescriptionInput'

type InputMode = 'photo' | 'text'

const TABS: {
  id: InputMode
  label: string
  hint: string
  icon: typeof PhotoIcon
}[] = [
  { id: 'photo', label: 'Use a photo', hint: 'Most accurate', icon: PhotoIcon },
  {
    id: 'text',
    label: 'Describe it',
    hint: 'No photo needed',
    icon: PencilSquareIcon,
  },
]

/* ── Small building blocks ───────────────────────────────────────────────── */

function StepBadge({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
      }`}
    >
      {n}
    </span>
  )
}

function InputChip({
  icon: Icon,
  label,
  onRemove,
  removeLabel,
}: {
  icon: typeof PhotoIcon
  label: string
  onRemove: () => void
  removeLabel: string
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-blue-700">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="-mr-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-blue-400 transition hover:bg-blue-100 hover:text-blue-700"
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  )
}

function EmptyBreedResult() {
  const lines = [
    'The likely breed with a confidence score',
    'Origin, size, and a side-by-side reference photo',
    'Temperament and common traits',
    'Care tips and a fun fact',
  ]
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 sm:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
          <SparklesIcon className="h-5 w-5" />
        </div>
        <p className="mt-3 text-[15px] font-bold text-slate-800">
          Your breed profile shows up here
        </p>
        <p className="mt-1 text-[12.5px] text-slate-500">
          Add a photo or a description above, then run the identifier.
        </p>
      </div>
      <ul className="mx-auto mt-5 grid max-w-xl gap-2 sm:grid-cols-2">
        {lines.map((line) => (
          <li
            key={line}
            className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] text-slate-600"
          >
            <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Main view ───────────────────────────────────────────────────────────── */

export function ClassifyBreedView() {
  const [mode, setMode] = React.useState<InputMode>('photo')
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [textInput, setTextInput] = React.useState('')
  const [localError, setLocalError] = React.useState<string | null>(null)
  const [imageAuthOpen, setImageAuthOpen] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus>('idle')
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const resultsRef = React.useRef<HTMLDivElement | null>(null)

  const { session, isLoading: isSessionLoading } = useSupabaseSession()
  const { isProfessional } = useUserType()
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

  React.useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current)
    },
    [],
  )

  // Bring the result area into view as soon as work starts, so the user is not
  // left staring at the form wondering whether anything happened.
  React.useEffect(() => {
    if (!classifyMutation.isPending) return
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    resultsRef.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [classifyMutation.isPending])

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
        current += Math.random() * (current < 60 ? 18 : 10)
        if (current >= 100) {
          setUploadProgress(100)
          setUploadStatus('done')
          clearInterval(timerRef.current!)
        } else {
          setUploadProgress(Math.round(current))
        }
      }, 120)
    },
    [classifyMutation],
  )

  const handleRemoveImage = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setImageFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setUploadStatus('idle')
    setLocalError(null)
  }

  const handleReset = () => {
    handleRemoveImage()
    setTextInput('')
    classifyMutation.reset()
    setMode('photo')
  }

  const trimmedText = textInput.trim()
  const hasInput = Boolean(imageFile) || trimmedText.length > 0
  const descriptionReady = trimmedText.length >= MIN_DESCRIPTION_LENGTH
  const needsAuthForImage = !isSessionLoading && !session && imageFile !== null
  const isReady = imageFile ? true : descriptionReady

  const runClassification = React.useCallback(() => {
    setLocalError(null)
    // The progress bar is cosmetic — the file itself goes out with the request,
    // so a submit mid-animation just finishes the animation instead of waiting.
    if (imageFile) {
      if (timerRef.current) clearInterval(timerRef.current)
      setUploadProgress(100)
      setUploadStatus('done')
    }
    classifyMutation.mutate({ imageFile, textInput: trimmedText })
  }, [classifyMutation, imageFile, trimmedText])

  const handleSubmit = () => {
    if (classifyMutation.isPending) return
    if (!hasInput) {
      setLocalError(
        'Add a photo or a short description first — either one is enough.',
      )
      return
    }
    if (!imageFile && !descriptionReady) {
      setLocalError(
        `Your description is a little short. Add at least ${MIN_DESCRIPTION_LENGTH} characters — breed, size, coat, and colour all help.`,
      )
      setMode('text')
      return
    }
    if (needsAuthForImage) {
      setLocalError(null)
      setImageAuthOpen(true)
      return
    }
    runClassification()
  }

  const errorMessage = localError ?? classifyMutation.error?.message ?? null
  const throttleError = classifyMutation.error as
    | (Error & { code?: string; isAuthed?: boolean })
    | null
  const showThrottleSignIn =
    (throttleError?.code === 'THROTTLE' && !throttleError.isAuthed) ||
    throttleError?.code === 'IMAGE_REQUIRES_AUTH'

  const result = classifyMutation.data
  const statusText = classifyMutation.isPending
    ? 'Identifying the breed. This usually takes a few seconds.'
    : result
      ? result.not_identified
        ? 'No breed could be identified from what you sent.'
        : `Result ready: ${result.breed_name}, ${result.confidence}% match.`
      : ''

  const activeStep = result ? 3 : classifyMutation.isPending ? 2 : 1

  return (
    <section className="relative z-10 min-h-screen px-5 pb-20 pt-7 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* ── Page header ───────────────────────────────────────────────── */}
        {/* Reassurance aimed at owners. Professionals get the page title from
            the shell chrome and do not need the pitch. */}
        {!isProfessional && (
          <FadeIn trigger="mount" className="mx-auto mb-7 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-700">
              <SparklesIcon className="h-3.5 w-3.5" />
              AI Breed Identifier
            </span>
            <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-slate-950 sm:text-[40px]">
              What breed is your pet?
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-slate-500">
              Upload a clear photo or just describe your pet in your own words —
              you only need one of the two.
            </p>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-semibold text-slate-500">
              {[
                { icon: BoltIcon, label: 'Answer in about 10 seconds' },
                { icon: PencilSquareIcon, label: 'Photo or description' },
                { icon: ShieldCheckIcon, label: 'Never stored or shared' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-blue-500" />
                  {label}
                </li>
              ))}
            </ul>
          </FadeIn>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="min-w-0">
            <FadeIn trigger="mount" delay={0.08}>
              <section
                aria-labelledby="breed-input-title"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_20px_rgba(15,28,63,0.06)]"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <StepBadge n={1} active={activeStep === 1} />
                    <div>
                      <h2
                        id="breed-input-title"
                        className="text-[13.5px] font-extrabold text-slate-900"
                      >
                        Tell us about your pet
                      </h2>
                      <p className="text-[11.5px] text-slate-500">
                        A photo, a description, or both
                      </p>
                    </div>
                  </div>
                  <QuotaBadge />
                </header>

                <div className="p-4 sm:p-5">
                  {/* Input method switcher */}
                  <div
                    role="tablist"
                    aria-label="How do you want to identify the breed?"
                    className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1.5"
                  >
                    {TABS.map(({ id, label, hint, icon: Icon }) => {
                      const selected = mode === id
                      const filled =
                        id === 'photo'
                          ? Boolean(imageFile)
                          : trimmedText.length > 0
                      return (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          id={`breed-tab-${id}`}
                          aria-selected={selected}
                          aria-controls={`breed-panel-${id}`}
                          onClick={() => setMode(id)}
                          onKeyDown={(event) => {
                            if (
                              event.key !== 'ArrowRight' &&
                              event.key !== 'ArrowLeft'
                            )
                              return
                            event.preventDefault()
                            const step = event.key === 'ArrowRight' ? 1 : -1
                            const index = TABS.findIndex((tab) => tab.id === id)
                            const next =
                              TABS[(index + step + TABS.length) % TABS.length]
                            setMode(next.id)
                            document
                              .getElementById(`breed-tab-${next.id}`)
                              ?.focus()
                          }}
                          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-bold transition ${
                            selected
                              ? 'bg-white text-blue-700 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{label}</span>
                          {filled ? (
                            <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <span className="hidden text-[10.5px] font-semibold text-slate-400 sm:inline">
                              · {hint}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Panels stay mounted so switching never loses work */}
                  <div className="mt-4">
                    <div
                      role="tabpanel"
                      id="breed-panel-photo"
                      aria-labelledby="breed-tab-photo"
                      hidden={mode !== 'photo'}
                    >
                      <BreedUploadZone
                        file={imageFile}
                        previewUrl={previewUrl}
                        status={uploadStatus}
                        progress={uploadProgress}
                        onFile={handleFile}
                        onRemove={handleRemoveImage}
                        onValidationError={setLocalError}
                      />
                      {!imageFile && (
                        <p className="mt-3 text-center text-[12px] text-slate-500">
                          No photo handy?{' '}
                          <button
                            type="button"
                            onClick={() => setMode('text')}
                            className="font-bold text-blue-600 underline-offset-2 hover:underline"
                          >
                            Describe your pet instead
                          </button>
                        </p>
                      )}
                    </div>

                    <div
                      role="tabpanel"
                      id="breed-panel-text"
                      aria-labelledby="breed-tab-text"
                      hidden={mode !== 'text'}
                    >
                      <BreedDescriptionInput
                        value={textInput}
                        onChange={(next) => {
                          setTextInput(next)
                          setLocalError(null)
                        }}
                        onSubmitShortcut={handleSubmit}
                      />
                    </div>
                  </div>

                  {/* What will be sent */}
                  {hasInput && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-700">
                        Sending
                      </span>
                      {imageFile && (
                        <InputChip
                          icon={PhotoIcon}
                          label={imageFile.name}
                          onRemove={handleRemoveImage}
                          removeLabel="Remove the photo"
                        />
                      )}
                      {trimmedText.length > 0 && (
                        <InputChip
                          icon={PencilSquareIcon}
                          label={`Description · ${trimmedText.length} chars`}
                          onRemove={() => setTextInput('')}
                          removeLabel="Clear the description"
                        />
                      )}
                    </div>
                  )}

                  {/* Sign-in requirement surfaced before the user commits */}
                  {needsAuthForImage && !errorMessage && (
                    <div className="mt-3 flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-amber-900">
                          Photo identification needs an account
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber-800">
                          Sign in to identify from a photo — or switch to{' '}
                          <button
                            type="button"
                            onClick={() => setMode('text')}
                            className="font-bold underline underline-offset-2"
                          >
                            a written description
                          </button>
                          , which is free.
                        </p>
                      </div>
                      <AuthModal
                        onAuthenticated={runClassification}
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
                  )}

                  {/* Errors */}
                  {errorMessage && (
                    <div
                      role="alert"
                      className="mt-3 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700"
                    >
                      <div className="flex items-start gap-2">
                        <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                      {showThrottleSignIn && (
                        <AuthModal
                          onAuthenticated={runClassification}
                          trigger={
                            <Button
                              type="button"
                              size="sm"
                              className="w-fit rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                            >
                              {throttleError.code === 'IMAGE_REQUIRES_AUTH'
                                ? 'Sign in to use a photo'
                                : 'Sign in for more free identifications'}
                            </Button>
                          }
                        />
                      )}
                    </div>
                  )}

                  <AuthModal
                    open={imageAuthOpen}
                    onOpenChange={setImageAuthOpen}
                    notice="Identifying a breed from a photo needs an account. Sign in to continue — or remove the photo and describe your pet instead, which is free."
                    onAuthenticated={() => {
                      setImageAuthOpen(false)
                      runClassification()
                    }}
                  />

                  {/* Actions */}
                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row-reverse sm:items-center sm:justify-between">
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      {hasInput && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleReset}
                          className="h-11 rounded-xl px-4 text-[12.5px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          Start over
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={classifyMutation.isPending}
                        className={`h-11 rounded-xl px-6 text-[13.5px] font-bold text-white transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                          isReady
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-blue-600/70 hover:bg-blue-600'
                        }`}
                      >
                        {classifyMutation.isPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            Identifying…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <MagnifyingGlassIcon className="h-4 w-4" />
                            {result ? 'Identify again' : 'Identify breed'}
                          </span>
                        )}
                      </Button>
                    </div>

                    <p className="text-[11.5px] leading-relaxed text-slate-400">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          Ready to identify
                        </span>
                      ) : (
                        'Add a photo or at least a short description to continue.'
                      )}
                    </p>
                  </div>
                </div>
              </section>
            </FadeIn>

            {/* ── Results ───────────────────────────────────────────────── */}
            <div ref={resultsRef} className="mt-8 scroll-mt-24">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <StepBadge n={2} active={activeStep >= 2} />
                  <div>
                    <h2 className="text-[13.5px] font-extrabold text-slate-900">
                      Breed profile
                    </h2>
                    <p className="text-[11.5px] text-slate-500">
                      {classifyMutation.isPending
                        ? 'Reading the details…'
                        : result
                          ? 'Based on what you sent — always a suggestion, never a pedigree.'
                          : 'Waiting for a photo or a description.'}
                    </p>
                  </div>
                </div>
                {result && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="h-9 rounded-lg border-slate-200 px-3 text-[12px] font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    Identify another pet
                  </Button>
                )}
              </div>

              <p aria-live="polite" className="sr-only">
                {statusText}
              </p>

              {classifyMutation.isPending ? (
                <PawMedLoader />
              ) : result ? (
                <BreedResults result={result} previewUrl={previewUrl} />
              ) : (
                <EmptyBreedResult />
              )}
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <FadeIn trigger="mount" delay={0.14} className="min-w-0">
            <div className="lg:sticky lg:top-20">
              <AnimalBreedSidebar />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export default ClassifyBreedView
