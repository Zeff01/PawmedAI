import * as React from 'react'
import {
  ArrowDownTrayIcon,
  BookmarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { CbcResultTable } from './CbcResultTable'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SAMPLE_QUALITY_OPTIONS, SPECIES_GROUPS } from '../constants'
import { describeSexAndStatus, formatAge } from '../utils/format'
import type { CbcAnalysis, Species, SpeciesSource } from '../types'

type CbcResultPanelProps = {
  analysis: CbcAnalysis
  onSave: () => void
  onDownload: () => void
  onSpeciesChange: (next: Species) => void
  saved?: boolean
  savedRecordId?: string | null
}

const SPECIES_SOURCE_LABELS: Record<SpeciesSource, string> = {
  selected: 'you chose this',
  report: 'read from the report',
}

function SpeciesBar({
  species,
  speciesDisplay,
  source,
  caveat,
  notAssessedCount,
  onChange,
}: {
  species: Species
  speciesDisplay: string
  source: SpeciesSource
  caveat: string
  notAssessedCount: number
  onChange: (next: Species) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <p className="min-w-0 text-[11.5px] leading-relaxed text-slate-600">
            <span className="font-extrabold text-slate-900">
              {speciesDisplay}
            </span>{' '}
            reference intervals
            <span className="text-slate-400">
              {' '}
              · {SPECIES_SOURCE_LABELS[source]}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            className="shrink-0 text-[11.5px] font-bold text-blue-600 underline-offset-2 transition hover:underline"
          >
            {open ? 'Never mind' : 'Not right?'}
          </button>
        </div>

        {open ? (
          <div className="mt-2.5 space-y-1.5 border-t border-slate-200/70 pt-2.5">
            <p className="text-[11px] text-slate-500">
              Re-flag this panel against:
            </p>
            <Select
              value={species}
              onValueChange={(next) => {
                setOpen(false)
                onChange(next as Species)
              }}
            >
              <SelectTrigger
                aria-label="Re-flag against a different species"
                className="h-9 w-full rounded-lg bg-white text-[12.5px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIES_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      {group.label}
                    </SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {caveat ? (
        <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-600">
          <InformationCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>
            {caveat}
            {notAssessedCount > 0
              ? ` ${notAssessedCount} submitted ${
                  notAssessedCount === 1 ? 'value was' : 'values were'
                } left unassessed for this reason.`
              : ''}
          </span>
        </p>
      ) : null}
    </div>
  )
}

export function CbcResultPanel({
  analysis,
  onSave,
  onDownload,
  onSpeciesChange,
  saved = false,
  savedRecordId = null,
}: CbcResultPanelProps) {
  const { patient, flag_count: flagCount } = analysis
  const hasFlags = flagCount > 0

  const subtitleParts = [
    patient.breed,
    patient.age_years !== null ? formatAge(patient.age_years) : null,
    'CBC panel',
  ].filter(Boolean)

  const qualityLabels = analysis.sample_quality
    .map(
      (flag) =>
        SAMPLE_QUALITY_OPTIONS.find((option) => option.value === flag)?.label ??
        flag,
    )
    .join(' · ')

  return (
    <section
      aria-labelledby="cbc-result-title"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      {/* ── Patient header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
              hasFlags ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          >
            {hasFlags ? (
              <ExclamationTriangleIcon className="h-4.5 w-4.5" />
            ) : (
              <CheckCircleIcon className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="min-w-0">
            <h2
              id="cbc-result-title"
              className="truncate text-[15px] font-extrabold text-slate-900"
            >
              {patient.pet_name || 'Unnamed patient'}
            </h2>
            <p className="truncate text-[11.5px] text-slate-500">
              {subtitleParts.join(' · ')}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`text-[10px] font-extrabold uppercase tracking-widest ${
              hasFlags ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {hasFlags ? 'Attention' : 'Within limits'}
          </p>
          <p className="text-[12.5px] font-bold text-slate-800">
            {hasFlags
              ? `${flagCount} ${flagCount === 1 ? 'flag' : 'flags'}`
              : 'No flags'}
          </p>
        </div>
      </header>

      <div className="space-y-5 p-4 sm:p-5">
        {/* ── Which reference table was used, and how it was chosen ────── */}
        <SpeciesBar
          species={patient.species}
          speciesDisplay={patient.species_display}
          source={analysis.species_source}
          caveat={analysis.species_caveat}
          notAssessedCount={analysis.not_assessed.length}
          onChange={onSpeciesChange}
        />

        {/* ── Run notice ───────────────────────────────────────────────── */}
        {analysis.notice ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[11.5px] leading-relaxed text-amber-900">
              {analysis.notice}
            </p>
          </div>
        ) : null}

        {/* ── Diagnostic brief ─────────────────────────────────────────── */}
        {analysis.diagnostic_brief ? (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-blue-700">
              <BookmarkIcon className="h-3 w-3" />
              Diagnostic brief
            </p>
            <p className="text-[12.5px] leading-relaxed text-slate-700">
              {analysis.diagnostic_brief}
            </p>
          </div>
        ) : null}

        {/* ── Panel tables ─────────────────────────────────────────────── */}
        <CbcResultTable results={analysis.results} />

        {/* ── Supporting context ───────────────────────────────────────── */}
        {analysis.sample_quality.length > 0 || analysis.smear_morphology ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
            {analysis.sample_quality.length > 0 ? (
              <p className="text-[11.5px] text-slate-600">
                <span className="font-extrabold uppercase tracking-wide text-slate-400">
                  Sample quality ·{' '}
                </span>
                <span className="font-bold text-amber-700">
                  {qualityLabels}
                </span>
              </p>
            ) : null}
            {analysis.smear_morphology ? (
              <p className="text-[11.5px] leading-relaxed text-slate-600">
                <span className="font-extrabold uppercase tracking-wide text-slate-400">
                  Smear ·{' '}
                </span>
                {analysis.smear_morphology}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* ── Clinical notes ───────────────────────────────────────────── */}
        {analysis.clinical_notes ? (
          <details className="group rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer list-none px-3.5 py-2.5 text-[11.5px] font-extrabold text-slate-700 transition hover:bg-slate-50">
              Interpretation &amp; next steps
              <span className="ml-1.5 font-semibold text-slate-400 group-open:hidden">
                — show
              </span>
            </summary>
            <p className="border-t border-slate-100 px-3.5 py-3 text-[12px] leading-relaxed text-slate-600">
              {analysis.clinical_notes}
            </p>
          </details>
        ) : null}

        {/* ── Patient recap ────────────────────────────────────────────── */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-[11.5px] sm:grid-cols-3">
          {[
            { label: 'Owner', value: patient.owner_name || 'Not recorded' },
            {
              label: 'Sex',
              value: describeSexAndStatus(patient.sex, patient.neuter_status),
            },
            {
              label: 'Parameters',
              value: `${analysis.results.length} submitted`,
            },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400">
                {item.label}
              </dt>
              <dd className="mt-0.5 truncate font-semibold text-slate-700">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            onClick={onSave}
            className="h-11 flex-1 rounded-xl bg-blue-600 text-[13px] font-bold text-white transition-all duration-150 hover:-translate-y-px hover:bg-blue-700 active:translate-y-0"
          >
            <BookmarkIcon className="h-4 w-4" />
            {saved ? 'Save another copy' : 'Save or correct result'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDownload}
            aria-label="Download this result as a PDF"
            className="h-11 rounded-xl border-slate-200 px-4 text-[12.5px] font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span className="sm:hidden">Download PDF</span>
          </Button>
        </div>

        {saved && savedRecordId ? (
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700">
            <CheckCircleIcon className="h-4 w-4" />
            Saved to your medical log as {savedRecordId}.
          </p>
        ) : (
          <p className="text-center text-[10.5px] leading-relaxed text-slate-400">
            Decision support only — correlate with the patient in front of you
            before acting on this brief.
          </p>
        )}
      </div>
    </section>
  )
}
