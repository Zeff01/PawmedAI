import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  PrinterIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FadeIn } from '@/components/motion/FadeIn'
import { RoutePending } from '@/components/RoutePending'
import { PawIcon } from '@/components/custom/custom-icons'
import { CbcResultTable } from './components/CbcResultTable'
import { StatusPill } from './components/StatusPill'
import { SAMPLE_QUALITY_OPTIONS } from './constants'
import {
  useAmendMedicalLog,
  useDeleteMedicalLog,
  useMedicalLog,
} from './hooks/useCbc'
import { describeSexAndStatus, formatAgeLong, formatDate } from './utils/format'
import { downloadCbcPdf, logToPdfInput } from './utils/pdf'

type RecordDetailViewProps = {
  recordId: string
}

const MAX_SMEAR_LENGTH = 2000

export function RecordDetailView({ recordId }: RecordDetailViewProps) {
  const navigate = useNavigate()
  const logQuery = useMedicalLog(recordId)
  const amendMutation = useAmendMedicalLog(recordId)
  const deleteMutation = useDeleteMedicalLog()

  const [smear, setSmear] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [savedAt, setSavedAt] = React.useState<number | null>(null)

  const log = logQuery.data

  React.useEffect(() => {
    if (!log) return
    setSmear(log.smear_morphology)
    setNotes(log.clinical_notes)
  }, [log?.smear_morphology, log?.clinical_notes, log])

  const isDirty = Boolean(
    log && (smear !== log.smear_morphology || notes !== log.clinical_notes),
  )

  const handleAmend = async () => {
    if (!log) return
    await amendMutation.mutateAsync({
      smear_morphology: smear,
      clinical_notes: notes,
    })
    setSavedAt(Date.now())
  }

  React.useEffect(() => {
    if (savedAt === null) return
    const timer = setTimeout(() => setSavedAt(null), 4000)
    return () => clearTimeout(timer)
  }, [savedAt])

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(recordId)
    void navigate({ to: '/medical-log' })
  }

  if (logQuery.isLoading) return <RoutePending />

  if (logQuery.isError || !log) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-5 py-16">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <ExclamationCircleIcon className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-[17px] font-extrabold text-slate-900">
            Record not found
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
            {logQuery.error?.message ??
              'This record may have been deleted, or it belongs to another account.'}
          </p>
          <Button
            asChild
            className="mt-5 h-10 rounded-lg bg-blue-600 px-4 text-[12.5px] font-bold text-white hover:bg-blue-700"
          >
            <Link to="/medical-log">Back to Medical Log</Link>
          </Button>
        </div>
      </section>
    )
  }

  const qualitySelected = new Set(log.sample_quality)

  return (
    <section className="relative z-10 min-h-screen px-5 pb-16 pt-6 md:px-10">
      <div className="mx-auto max-w-5xl">
        {/* ── Breadcrumb ──────────────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-400 print:hidden"
        >
          <Link to="/cbc-analyzer" className="transition hover:text-blue-600">
            CBC Analyzer
          </Link>
          <ChevronRightIcon className="h-3 w-3" />
          <Link to="/medical-log" className="transition hover:text-blue-600">
            Medical Log
          </Link>
          <ChevronRightIcon className="h-3 w-3" />
          <span className="font-semibold text-blue-600">Record Detail</span>
        </nav>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <FadeIn
          trigger="mount"
          className="mb-5 flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-[24px] font-extrabold leading-tight text-slate-950 sm:text-[26px]">
              Record Analysis Detail
            </h1>
            <p className="mt-1 text-[12px] text-slate-400">
              ID: #{log.record_id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="h-9 rounded-lg border-slate-200 px-3.5 text-[12.5px] font-bold text-slate-600 shadow-none hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </Button>
            <Button
              type="button"
              onClick={() => void downloadCbcPdf(logToPdfInput(log))}
              className="h-9 rounded-lg bg-blue-600 px-3.5 text-[12.5px] font-bold text-white shadow-none hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </FadeIn>

        <div className="space-y-4">
          {/* ── Patient summary + test information ──────────────────── */}
          <FadeIn
            trigger="mount"
            delay={0.04}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]"
          >
            <Card
              icon={<PawIcon />}
              title="Patient Summary"
              iconClassName="[&_svg]:h-4 [&_svg]:w-4 [&_svg]:fill-blue-600"
            >
              <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                <DetailRow label="Pet name" value={log.pet_name || '—'} />
                <DetailRow label="Owner" value={log.owner_name || '—'} />
                <DetailRow label="Species" value={log.species_display} />
                <DetailRow label="Assigned vet" value={log.vet_name || '—'} />
                <DetailRow label="Breed" value={log.breed || '—'} />
                <DetailRow
                  label="Patient age"
                  value={formatAgeLong(log.age_years)}
                />
                <DetailRow
                  label="Sex"
                  value={describeSexAndStatus(log.sex, log.neuter_status)}
                />
                <DetailRow
                  label="Profile"
                  value={log.pet_id !== null ? 'Linked' : 'Standalone'}
                />
              </dl>
            </Card>

            <Card
              icon={<DocumentTextIcon className="h-4 w-4" />}
              title="Test Information"
            >
              <dl className="space-y-3">
                <DetailRow label="Test type" value="CBC Panel" />
                <DetailRow
                  label="Analysis date"
                  value={formatDate(log.test_date)}
                />
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Overall status
                  </dt>
                  <dd>
                    <StatusPill status={log.result_status} />
                  </dd>
                </div>
                <DetailRow
                  label="Flags"
                  value={
                    log.flag_count > 0
                      ? `${log.flag_count} ${
                          log.flag_count === 1 ? 'parameter' : 'parameters'
                        }`
                      : 'None'
                  }
                />
              </dl>
            </Card>
          </FadeIn>

          {/* ── Diagnostic brief ────────────────────────────────────── */}
          {log.key_findings || log.diagnostic_brief ? (
            <FadeIn trigger="mount" delay={0.06}>
              <Card title="Diagnostic Brief">
                {log.key_findings ? (
                  <p className="mb-2 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                    {log.key_findings}
                  </p>
                ) : null}
                {log.diagnostic_brief ? (
                  <p className="text-[12.5px] leading-relaxed text-slate-700">
                    {log.diagnostic_brief}
                  </p>
                ) : null}
              </Card>
            </FadeIn>
          ) : null}

          {/* ── Blood analysis results ──────────────────────────────── */}
          <FadeIn trigger="mount" delay={0.08}>
            <Card title="Blood Analysis Results">
              <CbcResultTable
                results={log.evaluation.results ?? []}
                showUnitColumn
              />
            </Card>
          </FadeIn>

          {/* ── Sample quality + smear ──────────────────────────────── */}
          <FadeIn trigger="mount" delay={0.1}>
            <Card title="Sample Quality">
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUALITY_OPTIONS.map((option) => {
                  const selected = qualitySelected.has(option.value)
                  return (
                    <span
                      key={option.value}
                      title={option.hint}
                      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[11.5px] font-bold ${
                        selected
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      {option.label}
                    </span>
                  )
                })}
              </div>

              <div className="mt-5 space-y-2">
                <label
                  htmlFor="record-smear"
                  className="block text-[12.5px] font-bold text-slate-800"
                >
                  Blood Smear / Morphology
                </label>
                <Textarea
                  id="record-smear"
                  rows={4}
                  value={smear}
                  maxLength={MAX_SMEAR_LENGTH}
                  onChange={(event) => setSmear(event.target.value)}
                  placeholder="Add morphology notes (e.g., platelet clumping, schistocytes, band neutrophils)…"
                  className="min-h-24 resize-y rounded-lg border-slate-200 bg-slate-50 text-[12px] leading-relaxed shadow-none"
                />
              </div>
            </Card>
          </FadeIn>

          {/* ── Clinical notes ──────────────────────────────────────── */}
          <FadeIn trigger="mount" delay={0.12}>
            <Card title="Clinical Notes & Interpretation">
              <Textarea
                id="record-notes"
                rows={6}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Interpretation, differentials considered, and the follow-up plan…"
                className="min-h-32 resize-y rounded-lg border-slate-200 bg-slate-50 text-[12px] leading-relaxed shadow-none"
              />

              {amendMutation.isError ? (
                <p
                  role="alert"
                  className="mt-3 text-[11.5px] font-semibold text-red-600"
                >
                  {amendMutation.error.message}
                </p>
              ) : null}

              {/*
                Only appears once something has actually been edited, so the
                resting page stays as clean as the design.
              */}
              {isDirty || savedAt !== null ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3.5 print:hidden">
                  {isDirty ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => void handleAmend()}
                        disabled={amendMutation.isPending}
                        className="h-9 rounded-lg bg-blue-600 px-4 text-[12.5px] font-bold text-white shadow-none hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {amendMutation.isPending ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          'Save changes'
                        )}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setSmear(log.smear_morphology)
                          setNotes(log.clinical_notes)
                        }}
                        className="text-[12px] font-bold text-slate-500 transition hover:text-slate-800"
                      >
                        Revert
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      Saved
                    </span>
                  )}
                </div>
              ) : null}
            </Card>
          </FadeIn>

          <p className="px-1 pt-1 text-[10.5px] leading-relaxed text-slate-400">
            AI-assisted decision support. Reference intervals are
            species-specific defaults and may differ from your analyser's
            validated ranges.
          </p>

          {/* ── Destructive action, kept away from the record itself ── */}
          <div className="flex items-center gap-3 pt-1 print:hidden">
            {confirmingDelete ? (
              <>
                <span className="text-[11.5px] font-bold text-red-700">
                  Delete this record permanently?
                </span>
                <Button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleteMutation.isPending}
                  className="h-8 rounded-lg bg-red-600 px-3 text-[11.5px] font-bold text-white shadow-none hover:bg-red-700"
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete'}
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-[11.5px] font-bold text-slate-500 transition hover:text-slate-800"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-slate-400 transition hover:text-red-600"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Delete record
              </button>
            )}
          </div>

          {deleteMutation.isError ? (
            <p
              role="alert"
              className="text-[11.5px] font-semibold text-red-600"
            >
              {deleteMutation.error.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* ── Layout helpers ───────────────────────────────────────────────────────── */

function Card({
  icon,
  title,
  iconClassName = '',
  children,
}: {
  icon?: React.ReactNode
  title: string
  iconClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        {icon ? (
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ${iconClassName}`}
          >
            {icon}
          </span>
        ) : null}
        <h2 className="text-[14px] font-extrabold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

/** Label left, value right — the layout the design uses for both summary cards. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </dt>
      <dd
        className="min-w-0 truncate text-right text-[12.5px] font-bold text-slate-800"
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}

export default RecordDetailView
