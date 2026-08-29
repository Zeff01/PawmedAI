import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FadeIn } from '@/components/motion/FadeIn'
import PawMedLoader from '@/features/classify-dss/components/ResultSkeletonLoader'
import { CbcReportUpload } from './components/CbcReportUpload'
import type { ReportUploadStatus } from './components/CbcReportUpload'
import { CbcResultPanel } from './components/CbcResultPanel'
import { CbcValuesForm } from './components/CbcValuesForm'
import type { ValuesFormState } from './components/CbcValuesForm'
import { PatientStepFields } from './components/PatientStepFields'
import { SaveCbcDialog } from './components/SaveCbcDialog'
import { SupportingContextForm } from './components/SupportingContextForm'
import { SAMPLE_QUALITY_OPTIONS, SPECIES_OPTIONS } from './constants'
import { useAnalyzeCbc, useIsVeterinaryProfessional } from './hooks/useCbc'
import {
  EMPTY_PATIENT_FORM,
  formValuesFromAnalysis,
  patientSchema,
  prefilledFields,
} from './patientSchema'
import type { PatientFormValues } from './patientSchema'
import { describeSexAndStatus, formatAge } from './utils/format'
import { analysisToPdfInput, downloadCbcPdf } from './utils/pdf'
import type {
  CbcAnalysis,
  MedicalLogDetail,
  SampleQualityFlag,
  Species,
} from './types'

type InputMode = 'upload' | 'manual'

const STEP_PATIENT = 0
const STEP_PANEL = 1
const STEP_CONTEXT = 2
const STEP_RUN = 3
const STEP_COUNT = 4

const STEP_LABELS = ['Patient', 'CBC panel', 'Context', 'Analyse']

const TABS: Array<{
  id: InputMode
  label: string
  hint: string
  icon: typeof DocumentTextIcon
}> = [
  {
    id: 'upload',
    label: 'Upload report',
    hint: 'We read the values',
    icon: DocumentTextIcon,
  },
  {
    id: 'manual',
    label: 'Type values',
    hint: 'Straight from the analyser',
    icon: PencilSquareIcon,
  },
]

function toNumericValues(values: ValuesFormState): Record<string, number> {
  const numeric: Record<string, number> = {}
  Object.entries(values).forEach(([key, raw]) => {
    const trimmed = (raw ?? '').trim()
    if (!trimmed) return
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed) && parsed >= 0) numeric[key] = parsed
  })
  return numeric
}

export function CbcAnalyzerView() {
  const [step, setStep] = React.useState(STEP_PATIENT)
  const [showResult, setShowResult] = React.useState(false)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: EMPTY_PATIENT_FORM,
    mode: 'onTouched',
  })
  const patient = form.watch() as Partial<PatientFormValues>

  const [mode, setMode] = React.useState<InputMode>('upload')
  const [values, setValues] = React.useState<ValuesFormState>({})
  const [sampleQuality, setSampleQuality] = React.useState<
    Array<SampleQualityFlag>
  >([])
  const [smearMorphology, setSmearMorphology] = React.useState('')

  const [reportFile, setReportFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [uploadStatus, setUploadStatus] =
    React.useState<ReportUploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = React.useState(0)

  const [panelError, setPanelError] = React.useState<string | null>(null)
  const [analysis, setAnalysis] = React.useState<CbcAnalysis | null>(null)
  const [saveOpen, setSaveOpen] = React.useState(false)
  const [savedLog, setSavedLog] = React.useState<MedicalLogDetail | null>(null)

  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const columnRef = React.useRef<HTMLDivElement | null>(null)

  const { me } = useIsVeterinaryProfessional()
  const analyzeMutation = useAnalyzeCbc()

  const vetName = React.useMemo(() => {
    if (!me) return ''
    const full = `${me.first_name} ${me.last_name}`.trim()
    return full ? `Dr. ${full}` : ''
  }, [me])

  React.useEffect(() => {
    if (!reportFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(reportFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [reportFile])

  React.useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current)
    },
    [],
  )

  const numericValues = React.useMemo(() => toNumericValues(values), [values])
  const enteredCount = Object.keys(numericValues).length
  const hasPanel = Boolean(reportFile) || enteredCount > 0

  const inputSignature = React.useMemo(
    () =>
      JSON.stringify({
        patient,
        numericValues,
        sampleQuality,
        smearMorphology: smearMorphology.trim(),
        file: reportFile ? `${reportFile.name}:${reportFile.size}` : null,
      }),
    [patient, numericValues, sampleQuality, smearMorphology, reportFile],
  )
  const analysedSignature = React.useRef<string | null>(null)
  const isStale =
    analysis !== null && analysedSignature.current !== inputSignature

  const scrollToTop = () => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    columnRef.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const goToStep = (next: number) => {
    setStep(next)
    setShowResult(false)
    scrollToTop()
  }

  const handleContinue = () => {
    if (step === STEP_PATIENT) {
      void form.handleSubmit(() => goToStep(STEP_PANEL))()
      return
    }
    if (step === STEP_PANEL) {
      if (!hasPanel) {
        setPanelError(
          'Upload a CBC report or enter at least one blood value to continue.',
        )
        return
      }
      setPanelError(null)
    }
    goToStep(Math.min(step + 1, STEP_RUN))
  }

  const handleFile = React.useCallback((file: File) => {
    setPanelError(null)
    setReportFile(file)
    setUploadProgress(0)
    setUploadStatus('reading')
    let current = 0
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      current += Math.random() * (current < 60 ? 20 : 11)
      if (current >= 100) {
        setUploadProgress(100)
        setUploadStatus('ready')
        clearInterval(timerRef.current!)
      } else {
        setUploadProgress(Math.round(current))
      }
    }, 110)
  }, [])

  const handleRemoveFile = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setReportFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setUploadStatus('idle')
    setPanelError(null)
  }

  const handleReset = () => {
    handleRemoveFile()
    form.reset(EMPTY_PATIENT_FORM)
    setValues({})
    setSampleQuality([])
    setSmearMorphology('')
    setAnalysis(null)
    setSavedLog(null)
    setPanelError(null)
    analyzeMutation.reset()
    analysedSignature.current = null
    setMode('upload')
    setStep(STEP_PATIENT)
    setShowResult(false)
    scrollToTop()
  }

  /** Fire the request. Only reached once the patient values have validated. */
  const submitAnalysis = (
    validPatient: PatientFormValues,
    speciesOverride?: Species,
  ) => {
    if (!hasPanel) {
      setPanelError(
        'Upload a CBC report or enter at least one blood value to analyse.',
      )
      goToStep(STEP_PANEL)
      return
    }

    setPanelError(null)
    setSavedLog(null)
    scrollToTop()

    if (reportFile) {
      if (timerRef.current) clearInterval(timerRef.current)
      setUploadProgress(100)
      setUploadStatus('ready')
    }

    const signature = inputSignature
    analyzeMutation.mutate(
      {
        reportImage: reportFile,
        values: numericValues,
        species: speciesOverride ?? validPatient.species,
        speciesLabel: validPatient.speciesLabel,
        petName: validPatient.petName,
        ownerName: validPatient.ownerName,
        breed: validPatient.breed,
        ageYears: Number(validPatient.ageYears),
        sex: validPatient.sex,
        neuterStatus: validPatient.neuterStatus,
        sampleQuality,
        smearMorphology,
      },
      {
        onSuccess: (result) => {
          setAnalysis(result)
          analysedSignature.current = signature
          setShowResult(true)
          if (result.read_from_image) {
            const merged: ValuesFormState = { ...values }
            Object.entries(result.values).forEach(([key, value]) => {
              if (!merged[key]?.trim()) merged[key] = String(value)
            })
            setValues(merged)
          }
          if (result.sample_quality.length > 0) {
            setSampleQuality(result.sample_quality)
          }
          if (result.smear_morphology && !smearMorphology) {
            setSmearMorphology(result.smear_morphology)
          }

          form.reset(formValuesFromAnalysis(result))
        },
        onError: (error) => {
          const failure = error as { code?: string }
          if (failure.code === 'species_required') {
            form.setError('species', {
              type: 'server',
              message: 'Choose the species so the panel can be flagged.',
            })
            goToStep(STEP_PATIENT)
          }
        },
      },
    )
  }

  const runAnalysis = () => {
    if (analyzeMutation.isPending) return
    void form.handleSubmit(
      (validPatient) => submitAnalysis(validPatient),
      () => goToStep(STEP_PATIENT),
    )()
  }

  const changeSpecies = (next: Species) => {
    form.setValue('species', next, { shouldValidate: true })
    if (next === 'other') {
      form.setValue('speciesLabel', '')
      form.setError('speciesLabel', {
        type: 'manual',
        message: 'Name the species to re-flag the panel.',
      })
      goToStep(STEP_PATIENT)
      return
    }
    void form.handleSubmit(
      (validPatient) => submitAnalysis(validPatient, next),
      () => goToStep(STEP_PATIENT),
    )()
  }

  const analyzeError = analyzeMutation.error as
    | (Error & { code?: string; looksHuman?: boolean })
    | null
  const isSpeciesPrompt = analyzeError?.code === 'species_required'
  const requestError = isSpeciesPrompt ? null : (analyzeError?.message ?? null)

  const prefilled = React.useMemo(
    () => (analysis ? prefilledFields(analysis) : []),
    [analysis],
  )

  const speciesSummary = patient.species
    ? patient.species === 'other'
      ? (patient.speciesLabel?.trim() ?? '') || 'Other'
      : (SPECIES_OPTIONS.find((option) => option.value === patient.species)
          ?.label ?? patient.species)
    : 'Not set'

  const patientSummary =
    [
      patient.petName?.trim() ?? '',
      patient.ownerName?.trim() ?? '',
      patient.breed?.trim() ?? '',
      patient.ageYears?.trim() ? formatAge(Number(patient.ageYears)) : '',
      patient.sex || patient.neuterStatus
        ? describeSexAndStatus(
            patient.sex ?? 'unknown',
            patient.neuterStatus ?? 'unknown',
          )
        : '',
    ]
      .filter((entry) => entry && entry !== 'Not recorded')
      .join(' · ') || 'Incomplete'

  const panelSummary =
    [
      reportFile ? reportFile.name : '',
      enteredCount > 0
        ? `${enteredCount} value${enteredCount === 1 ? '' : 's'} typed`
        : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'Nothing yet'

  const contextSummary =
    [
      sampleQuality.length > 0
        ? sampleQuality
            .map(
              (flag) =>
                SAMPLE_QUALITY_OPTIONS.find((option) => option.value === flag)
                  ?.label ?? flag,
            )
            .join(', ')
        : '',
      smearMorphology.trim() ? 'Smear noted' : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'None'

  const statusText = analyzeMutation.isPending
    ? 'Analysing the panel. This usually takes a few seconds.'
    : analysis && showResult
      ? analysis.flag_count > 0
        ? `Analysis ready: ${analysis.flag_count} flagged ${
            analysis.flag_count === 1 ? 'parameter' : 'parameters'
          }.`
        : 'Analysis ready: every submitted parameter is within reference limits.'
      : ''

  const onResultView = showResult && analysis !== null

  return (
    <section className="relative z-10 min-h-screen px-5 pb-20 pt-7 md:px-10">
      <div ref={columnRef} className="mx-auto max-w-3xl scroll-mt-20">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <FadeIn
          trigger="mount"
          className="mb-6 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[26px] font-extrabold leading-tight text-slate-950 sm:text-[30px]">
                CBC Analyzer
              </h1>
            </div>
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-slate-500">
              Upload a complete blood count and get a structured diagnostic
              brief in seconds.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-lg border-slate-200 px-4 text-[12.5px] font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Link to="/medical-log">
              <ClipboardDocumentListIcon className="h-4 w-4" />
              See Medical Log
            </Link>
          </Button>
        </FadeIn>

        <p aria-live="polite" className="sr-only">
          {statusText}
        </p>

        {analyzeMutation.isPending ? (
          <PawMedLoader />
        ) : onResultView ? (
          /* ── The result takes over the column ─────────────────────── */
          <FadeIn trigger="mount" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => goToStep(STEP_RUN)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500 transition hover:text-slate-800"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Back to the form
              </button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="h-9 rounded-lg px-3 text-[12px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                New analysis
              </Button>
            </div>

            <CbcResultPanel
              analysis={analysis}
              saved={Boolean(savedLog)}
              savedRecordId={savedLog?.record_id ?? null}
              onSave={() => setSaveOpen(true)}
              onDownload={() =>
                void downloadCbcPdf(analysisToPdfInput(analysis))
              }
              onSpeciesChange={changeSpecies}
            />
          </FadeIn>
        ) : (
          /* ── The form ─────────────────────────────────────────────── */
          <FadeIn trigger="mount" delay={0.04}>
            <section
              aria-labelledby="cbc-input-title"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"
                  >
                    <BeakerIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2
                      id="cbc-input-title"
                      className="text-[13.5px] font-extrabold text-slate-900"
                    >
                      New analysis
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Step {step + 1} of {STEP_COUNT} · {STEP_LABELS[step]}
                    </p>
                  </div>
                </div>
                {analysis && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowResult(true)
                      scrollToTop()
                    }}
                    className="text-[12px] font-bold text-blue-600 underline-offset-2 transition hover:underline"
                  >
                    View last result
                  </button>
                )}
              </header>

              <div className="space-y-5 p-5 sm:p-6">
                {/* ── Step 1 · Patient ──────────────────────────────── */}
                {step === STEP_PATIENT ? (
                  <div className="space-y-5">
                    <StepHeading
                      title="Animal patient information"
                      description="All of it is required. Species decides which reference intervals the panel is flagged against; the rest identifies the record and informs the interpretation."
                      required
                    />

                    {isSpeciesPrompt ? (
                      <div
                        className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 ${
                          analyzeError.looksHuman
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-amber-200 bg-amber-50'
                        }`}
                      >
                        <QuestionMarkCircleIcon
                          aria-hidden="true"
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            analyzeError.looksHuman
                              ? 'text-orange-600'
                              : 'text-amber-600'
                          }`}
                        />
                        <p
                          className={`text-[11.5px] leading-relaxed ${
                            analyzeError.looksHuman
                              ? 'text-orange-900'
                              : 'text-amber-900'
                          }`}
                        >
                          {analyzeError.message}
                        </p>
                      </div>
                    ) : null}

                    <Form {...form}>
                      <PatientStepFields
                        form={form}
                        prefilled={prefilled}
                        disabled={analyzeMutation.isPending}
                      />
                    </Form>
                  </div>
                ) : null}

                {/* ── Step 2 · CBC panel ────────────────────────────── */}
                {step === STEP_PANEL ? (
                  <div className="space-y-4">
                    <StepHeading
                      title="The CBC panel"
                      description="Upload the analyser printout and we will transcribe it, or type the values in yourself. You can do both — anything you type wins."
                    />

                    <div
                      role="tablist"
                      aria-label="How do you want to enter the panel?"
                      className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1.5"
                    >
                      {TABS.map(({ id, label, hint, icon: Icon }) => {
                        const selected = mode === id
                        return (
                          <button
                            key={id}
                            type="button"
                            role="tab"
                            id={`cbc-tab-${id}`}
                            aria-selected={selected}
                            aria-controls={`cbc-panel-${id}`}
                            onClick={() => setMode(id)}
                            onKeyDown={(event) => {
                              if (
                                event.key !== 'ArrowRight' &&
                                event.key !== 'ArrowLeft'
                              )
                                return
                              event.preventDefault()
                              const next = TABS.find((tab) => tab.id !== id)
                              if (!next) return
                              setMode(next.id)
                              document
                                .getElementById(`cbc-tab-${next.id}`)
                                ?.focus()
                            }}
                            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px] font-bold transition ${
                              selected
                                ? 'bg-white text-blue-700'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{label}</span>
                            <span className="hidden text-[10px] font-semibold text-slate-400 sm:inline">
                              · {hint}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Panels stay mounted so switching never loses work */}
                    <div
                      role="tabpanel"
                      id="cbc-panel-upload"
                      aria-labelledby="cbc-tab-upload"
                      hidden={mode !== 'upload'}
                    >
                      <CbcReportUpload
                        file={reportFile}
                        previewUrl={previewUrl}
                        status={uploadStatus}
                        progress={uploadProgress}
                        onFile={handleFile}
                        onRemove={handleRemoveFile}
                        onValidationError={setPanelError}
                      />
                      {enteredCount > 0 ? (
                        <p className="mt-2.5 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
                          {enteredCount} value{enteredCount === 1 ? '' : 's'}{' '}
                          you typed will be used as well — yours take priority
                          over anything read off the report.
                        </p>
                      ) : (
                        <p className="mt-2.5 text-center text-[11.5px] text-slate-500">
                          No report to hand?{' '}
                          <button
                            type="button"
                            onClick={() => setMode('manual')}
                            className="font-bold text-blue-600 underline-offset-2 hover:underline"
                          >
                            Type the values instead
                          </button>
                        </p>
                      )}
                    </div>

                    <div
                      role="tabpanel"
                      id="cbc-panel-manual"
                      aria-labelledby="cbc-tab-manual"
                      hidden={mode !== 'manual'}
                    >
                      <CbcValuesForm
                        values={values}
                        onChange={(next) => {
                          setValues(next)
                          setPanelError(null)
                        }}
                        extractedKeys={analysis?.extracted_values}
                        disabled={analyzeMutation.isPending}
                      />
                    </div>

                    {panelError ? (
                      <p
                        role="alert"
                        className="text-destructive text-[11.5px] font-semibold"
                      >
                        {panelError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* ── Step 3 · Supporting context ───────────────────── */}
                {step === STEP_CONTEXT ? (
                  <div className="space-y-4">
                    <StepHeading
                      title="Supporting context"
                      description="Optional, but it changes how much weight the interpretation puts on the numbers — a clotted sample can fake a thrombocytopenia."
                      optional
                    />
                    <SupportingContextForm
                      sampleQuality={sampleQuality}
                      smearMorphology={smearMorphology}
                      onSampleQualityChange={setSampleQuality}
                      onSmearMorphologyChange={setSmearMorphology}
                      disabled={analyzeMutation.isPending}
                    />
                  </div>
                ) : null}

                {/* ── Step 4 · Review and run ───────────────────────── */}
                {step === STEP_RUN ? (
                  <div className="space-y-4">
                    <StepHeading
                      title="Review and analyse"
                      description="This is what will be sent. Use Edit on any row to change it."
                    />

                    <dl className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                      <ReviewRow
                        label="Species"
                        value={speciesSummary}
                        onEdit={() => goToStep(STEP_PATIENT)}
                        muted={!patient.species}
                      />
                      <ReviewRow
                        label="Patient"
                        value={patientSummary}
                        onEdit={() => goToStep(STEP_PATIENT)}
                        muted={patientSummary === 'Incomplete'}
                      />
                      <ReviewRow
                        label="Panel"
                        value={panelSummary}
                        onEdit={() => goToStep(STEP_PANEL)}
                        muted={!hasPanel}
                      />
                      <ReviewRow
                        label="Context"
                        value={contextSummary}
                        onEdit={() => goToStep(STEP_CONTEXT)}
                        muted={contextSummary === 'None'}
                      />
                    </dl>

                    {isStale ? (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                        <ExclamationTriangleIcon
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                        />
                        <p className="text-[11.5px] leading-relaxed text-amber-900">
                          The inputs have changed since the last run, so the
                          saved result is out of date. Run the analysis again to
                          update it.
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* ── Request failures only ─────────────────────────── */}
                {requestError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-700"
                  >
                    <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{requestError}</span>
                  </div>
                ) : null}

                {/* ── Navigation ────────────────────────────────────── */}
                <div className="space-y-2.5 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    {step > STEP_PATIENT ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToStep(step - 1)}
                        disabled={analyzeMutation.isPending}
                        className="h-11 rounded-xl border-slate-200 px-4 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back
                      </Button>
                    ) : null}

                    {step < STEP_RUN ? (
                      <Button
                        type="button"
                        onClick={handleContinue}
                        className="h-11 flex-1 rounded-xl bg-blue-600 text-[13px] font-bold text-white transition-all duration-150 hover:-translate-y-px hover:bg-blue-700 active:translate-y-0"
                      >
                        {step === STEP_CONTEXT ? 'Skip' : 'Next'}
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={runAnalysis}
                        disabled={analyzeMutation.isPending}
                        className="h-11 flex-1 rounded-xl bg-blue-600 text-[13px] font-bold text-white transition-all duration-150 hover:-translate-y-px hover:bg-blue-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <PlayIcon className="h-4 w-4" />
                        {analysis ? 'Run analysis again' : 'Run AI analysis'}
                      </Button>
                    )}

                    {hasPanel || analysis ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleReset}
                        disabled={analyzeMutation.isPending}
                        className="h-11 rounded-xl px-3 text-[12px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      >
                        Start over
                      </Button>
                    ) : null}
                  </div>

                  <p className="text-center text-[10.5px] leading-relaxed text-slate-400">
                    Nothing is stored until you choose to save it. Flags come
                    from species-specific reference intervals, not from the AI.
                  </p>
                </div>
              </div>
            </section>
          </FadeIn>
        )}
      </div>

      {analysis ? (
        <SaveCbcDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          analysis={analysis}
          prefilled={prefilled}
          vetName={vetName}
          onSaved={setSavedLog}
          onDiscard={handleReset}
        />
      ) : null}
    </section>
  )
}

/* ── Step chrome ──────────────────────────────────────────────────────────── */

function StepHeading({
  title,
  description,
  optional = false,
  required = false,
}: {
  title: string
  description: string
  optional?: boolean
  required?: boolean
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[15px] font-extrabold text-slate-900">{title}</h3>
        {optional ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Optional
          </span>
        ) : null}
        {required ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
            All required
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  onEdit,
  muted = false,
}: {
  label: string
  value: string
  onEdit: () => void
  muted?: boolean
}) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-2.5">
      <dt className="w-16 shrink-0 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
        {label}
      </dt>
      <dd
        className={`min-w-0 flex-1 text-[12px] leading-relaxed ${
          muted ? 'text-slate-400' : 'font-semibold text-slate-700'
        }`}
      >
        {value}
      </dd>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-[11.5px] font-bold text-blue-600 underline-offset-2 transition hover:underline"
      >
        Edit
      </button>
    </div>
  )
}

export default CbcAnalyzerView
