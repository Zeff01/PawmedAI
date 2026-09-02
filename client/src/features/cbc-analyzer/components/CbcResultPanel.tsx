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

/** Section heading inside the panel — the hairlines do the framing. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
      {children}
    </p>
  )
}

function OutcomeStrip({
  flagged,
  normal,
  notAssessed,
  submitted,
}: {
  flagged: number
  normal: number
  notAssessed: number
  submitted: number
}) {
  const cells = [
    { label: 'Flagged', value: flagged, dot: 'bg-amber-500' },
    { label: 'Within limits', value: normal, dot: 'bg-emerald-500' },
    ...(notAssessed > 0
      ? [
          {
            label: 'Not assessed',
            value: notAssessed,
            dot: 'bg-slate-300',
          },
        ]
      : []),
    { label: 'Submitted', value: submitted, dot: 'bg-blue-500' },
  ]

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-4">
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className={`px-4 py-3 ${i % 2 === 1 ? 'border-l border-slate-200' : ''} ${
            i >= 2 ? 'border-t border-slate-200 sm:border-t-0' : ''
          } ${i > 0 ? 'sm:border-l sm:border-slate-200' : ''}`}
        >
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${cell.dot}`}
            />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {cell.label}
            </p>
          </div>
          <p className="mt-1 text-[18px] font-extrabold leading-none tabular-nums text-slate-900">
            {cell.value}
          </p>
        </div>
      ))}
    </div>
  )
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="min-w-0 text-[11.5px] leading-relaxed text-slate-600">
          Flagged against{' '}
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
        <div className="mt-2.5 max-w-xs space-y-1.5">
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

      {caveat ? (
        <p className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
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
  const [onlyFlagged, setOnlyFlagged] = React.useState(false)

  const normalCount = analysis.results.filter(
    (row) => row.status === 'normal',
  ).length
  const notAssessedCount = analysis.results.filter(
    (row) => row.status === 'not_assessed',
  ).length

  const subtitleParts = [
    patient.breed,
    patient.age_years !== null ? formatAge(patient.age_years) : null,
    describeSexAndStatus(patient.sex, patient.neuter_status),
    patient.owner_name ? `Owner: ${patient.owner_name}` : null,
  ].filter(Boolean)

  const qualityLabels = analysis.sample_quality
    .map(
      (flag) =>
        SAMPLE_QUALITY_OPTIONS.find((option) => option.value === flag)?.label ??
        flag,
    )
    .join(' · ')

  const hasContext =
    analysis.sample_quality.length > 0 || Boolean(analysis.smear_morphology)

  return (
    <section aria-labelledby="cbc-result-title" className="bg-white">
      {/* ── Patient header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${
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
              className="truncate text-[17px] font-extrabold leading-tight text-slate-900"
            >
              {patient.pet_name || 'Unnamed patient'}
            </h2>
            {/* Identity in one line under the name, rather than a recap block
                stranded below the actions. */}
            <p className="text-[11.5px] leading-relaxed text-slate-500">
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
          <p className="text-[13px] font-bold text-slate-800">
            {hasFlags
              ? `${flagCount} ${flagCount === 1 ? 'flag' : 'flags'}`
              : 'No flags'}
          </p>
        </div>
      </header>

      <div className="flex flex-col divide-y divide-slate-100">
        {/* ── Outcome in counts, then which table produced them ────────── */}
        <div className="space-y-4 py-5">
          <OutcomeStrip
            flagged={flagCount}
            normal={normalCount}
            notAssessed={notAssessedCount}
            submitted={analysis.results.length}
          />
          <SpeciesBar
            species={patient.species}
            speciesDisplay={patient.species_display}
            source={analysis.species_source}
            caveat={analysis.species_caveat}
            notAssessedCount={analysis.not_assessed.length}
            onChange={onSpeciesChange}
          />
        </div>

        {/* ── Run notice ───────────────────────────────────────────────── */}
        {analysis.notice ? (
          <div className="flex items-start gap-2 border-y border-amber-200 bg-amber-50 px-4 py-3">
            <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[11.5px] leading-relaxed text-amber-900">
              {analysis.notice}
            </p>
          </div>
        ) : null}

        {/* ── Diagnostic brief ─────────────────────────────────────────── */}
        {analysis.diagnostic_brief ? (
          <div className="py-5">
            <SectionLabel>Diagnostic brief</SectionLabel>
            {/* Capped measure: a full-width clinical paragraph is a wall. */}
            <p className="mt-2 max-w-prose text-[13.5px] leading-relaxed text-slate-700">
              {analysis.diagnostic_brief}
            </p>
          </div>
        ) : null}

        {/* ── Panel tables ─────────────────────────────────────────────── */}
        <div className="py-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <SectionLabel>Panel results</SectionLabel>
            {/* Finding 12 flags among 15 rows should not need a scan. */}
            {hasFlags ? (
              <label className="inline-flex cursor-pointer items-center gap-2 text-[11.5px] font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={onlyFlagged}
                  onChange={(event) => setOnlyFlagged(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                />
                Flagged only
              </label>
            ) : null}
          </div>
          <CbcResultTable
            results={analysis.results}
            onlyFlagged={onlyFlagged}
          />
        </div>

        {/* ── Supporting context ───────────────────────────────────────── */}
        {hasContext ? (
          <div className="space-y-2 py-5">
            <SectionLabel>Sample and smear</SectionLabel>
            {analysis.sample_quality.length > 0 ? (
              <p className="text-[12px] text-slate-600">
                <span className="font-bold text-slate-400">Quality · </span>
                <span className="font-bold text-amber-700">
                  {qualityLabels}
                </span>
              </p>
            ) : null}
            {analysis.smear_morphology ? (
              <p className="max-w-prose text-[12px] leading-relaxed text-slate-600">
                <span className="font-bold text-slate-400">Smear · </span>
                {analysis.smear_morphology}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* ── Clinical notes — the "so what", so it opens by default ───── */}
        {analysis.clinical_notes ? (
          <details open className="group py-5">
            <summary className="flex cursor-pointer list-none items-center gap-2">
              <SectionLabel>Interpretation &amp; next steps</SectionLabel>
              <span className="text-[11px] font-bold text-blue-600 group-open:hidden">
                show
              </span>
              <span className="hidden text-[11px] font-bold text-slate-400 group-open:inline">
                hide
              </span>
            </summary>
            <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-slate-600">
              {analysis.clinical_notes}
            </p>
          </details>
        ) : null}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={onSave}
              className="h-11 rounded-lg bg-blue-600 px-6 text-[13px] font-bold text-white transition hover:bg-blue-700 sm:flex-none"
            >
              <BookmarkIcon className="h-4 w-4" />
              {saved ? 'Save another copy' : 'Save or correct result'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onDownload}
              className="h-11 rounded-lg border-slate-200 px-4 text-[12.5px] font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {saved && savedRecordId ? (
            <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" />
              Saved to your medical log as {savedRecordId}.
            </p>
          ) : (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Decision support only — correlate with the patient in front of you
              before acting on this brief.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
