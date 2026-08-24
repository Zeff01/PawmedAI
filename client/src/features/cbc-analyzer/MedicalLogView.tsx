import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion/FadeIn'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MedicalLogTable } from './components/MedicalLogTable'
import { buildMedicalLogColumns } from './components/medicalLogColumns'
import { SPECIES_GROUPS } from './constants'
import { fetchMedicalLog, fetchMedicalLogs } from './api/medicalLogs'
import { useMedicalLogSummary, useMedicalLogs } from './hooks/useCbc'
import { buildMedicalLogCsv, downloadCsv } from './utils/csv'
import { downloadCbcPdf, logToPdfInput } from './utils/pdf'
import type { PaginationState } from '@tanstack/react-table'
import type { MedicalLogFilters, ResultStatus, Species } from './types'

const DEFAULT_PAGE_SIZE = 8
const ALL = 'all'
const DEFAULT_DAYS = 30

const STATUS_FILTERS: Array<{ value: ResultStatus | ''; label: string }> = [
  { value: '', label: 'Result Status' },
  { value: 'normal', label: 'Normal only' },
  { value: 'low', label: 'Low flags' },
  { value: 'high', label: 'High flags' },
  { value: 'abnormal', label: 'Mixed flags' },
]

const DAY_FILTERS: Array<{ value: number | ''; label: string }> = [
  { value: 7, label: 'Last 7 Days' },
  { value: 30, label: 'Last 30 Days' },
  { value: 90, label: 'Last 90 Days' },
  { value: 365, label: 'Last 12 Months' },
  { value: '', label: 'All Time' },
]

const FILTER_CONTROL =
  'h-10 w-auto min-w-36 rounded-lg border-slate-200 bg-white text-[13px] font-medium text-slate-700 shadow-none'

export function MedicalLogView() {
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [species, setSpecies] = React.useState<Species | ''>('')
  const [resultStatus, setResultStatus] = React.useState<ResultStatus | ''>('')
  const [days, setDays] = React.useState<number | ''>(DEFAULT_DAYS)
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [isExporting, setIsExporting] = React.useState(false)
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  React.useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [debouncedSearch, species, resultStatus, days])

  const filters: MedicalLogFilters = {
    search: debouncedSearch,
    species,
    result_status: resultStatus,
    days,
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
  }

  const logsQuery = useMedicalLogs(filters)
  const summaryQuery = useMedicalLogSummary(filters)

  const rows = logsQuery.data?.results ?? []
  const total = logsQuery.data?.count ?? 0
  const hasFilters = Boolean(
    debouncedSearch || species || resultStatus || days !== DEFAULT_DAYS,
  )

  const clearFilters = () => {
    setSearch('')
    setSpecies('')
    setResultStatus('')
    setDays(DEFAULT_DAYS)
  }

  const handleExport = async () => {
    setActionError(null)
    setIsExporting(true)
    try {
      const all = await fetchMedicalLogs({
        ...filters,
        page: 1,
        page_size: 200,
      })
      downloadCsv(
        `pawmed-medical-log-${new Date().toISOString().slice(0, 10)}.csv`,
        buildMedicalLogCsv(all.results),
      )
      if (all.count > all.results.length) {
        setActionError(
          `Exported the first ${all.results.length} of ${all.count} records. Narrow the filters to export the rest.`,
        )
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'The export failed.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleRowDownload = React.useCallback(async (recordId: string) => {
    setActionError(null)
    setDownloadingId(recordId)
    try {
      const log = await fetchMedicalLog(recordId)
      await downloadCbcPdf(logToPdfInput(log))
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'That record could not be downloaded.',
      )
    } finally {
      setDownloadingId(null)
    }
  }, [])

  const columns = React.useMemo(
    () =>
      buildMedicalLogColumns({
        downloadingId,
        onDownload: (recordId) => void handleRowDownload(recordId),
      }),
    [downloadingId, handleRowDownload],
  )

  const summary = summaryQuery.data

  return (
    <section className="relative z-10 min-h-screen px-5 pb-16 pt-7 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <FadeIn
          trigger="mount"
          className="mb-6 flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-slate-950">
              Medical Log
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">
              View and manage all past blood analysis records for your patients
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || total === 0}
            className="h-10 shrink-0 rounded-lg border-slate-200 px-4 text-[13px] font-bold text-slate-700 shadow-none hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownTrayIcon className="h-4 w-4" />
            )}
            Export CSV
          </Button>
        </FadeIn>

        {/* ── Filters, sitting on the page rather than in a panel ─────── */}
        <FadeIn
          trigger="mount"
          delay={0.04}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <div className="relative min-w-0 flex-1 basis-72 sm:max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by pet name or owner..."
              aria-label="Search records"
              className="h-10 rounded-lg border-slate-200 bg-white pl-10 text-[13px] shadow-none"
            />
          </div>

          <Select
            value={species || ALL}
            onValueChange={(next) =>
              setSpecies(next === ALL ? '' : (next as Species))
            }
          >
            <SelectTrigger
              aria-label="Filter by species"
              className={FILTER_CONTROL}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Species</SelectItem>
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

          <Select
            value={resultStatus || ALL}
            onValueChange={(next) =>
              setResultStatus(next === ALL ? '' : (next as ResultStatus))
            }
          >
            <SelectTrigger
              aria-label="Filter by result status"
              className={FILTER_CONTROL}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.label} value={option.value || ALL}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={days === '' ? ALL : String(days)}
            onValueChange={(next) => setDays(next === ALL ? '' : Number(next))}
          >
            <SelectTrigger
              aria-label="Filter by date range"
              className={FILTER_CONTROL}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_FILTERS.map((option) => (
                <SelectItem
                  key={option.label}
                  value={option.value === '' ? ALL : String(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="shrink-0 px-2 text-[13px] font-bold text-blue-600 transition hover:text-blue-700 disabled:cursor-default disabled:text-slate-300"
          >
            Clear All
          </button>
        </FadeIn>

        {/* ── Stat tiles ──────────────────────────────────────────────── */}
        <FadeIn
          trigger="mount"
          delay={0.08}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatTile
            label="Total records"
            value={summary?.total}
            loading={summaryQuery.isLoading}
          />
          <StatTile
            label="Normal results"
            value={summary?.normal}
            loading={summaryQuery.isLoading}
            change={summary?.normal_change ?? null}
          />
          <StatTile
            label="Abnormal results"
            value={summary?.abnormal}
            loading={summaryQuery.isLoading}
            change={summary?.abnormal_change ?? null}
          />
          <StatTile
            label="This month"
            value={summary?.this_month}
            loading={summaryQuery.isLoading}
          />
        </FadeIn>

        {actionError ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-900"
          >
            {actionError}
          </p>
        ) : null}

        {/* ── Records ─────────────────────────────────────────────────── */}
        <FadeIn trigger="mount" delay={0.12} className="mt-10">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {logsQuery.isError ? (
              <div className="px-6 py-12 text-center">
                <p className="text-[13.5px] font-bold text-slate-800">
                  We could not load your records
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-slate-500">
                  {logsQuery.error.message}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void logsQuery.refetch()}
                  className="mt-4 h-10 rounded-lg border-slate-200 px-4 text-[12.5px] font-bold shadow-none"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Try again
                </Button>
              </div>
            ) : logsQuery.isLoading ? (
              <TableSkeleton rows={pagination.pageSize} />
            ) : (
              <MedicalLogTable
                columns={columns}
                data={rows}
                rowCount={total}
                pagination={pagination}
                onPaginationChange={setPagination}
                summary={
                  <>
                    Showing {rows.length} of {total} record
                    {total === 1 ? '' : 's'}
                    {logsQuery.isFetching ? ' · refreshing…' : ''}
                  </>
                }
                emptyState={
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[13.5px] font-bold text-slate-800">
                      {hasFilters
                        ? 'No records match these filters'
                        : 'No records in the last 30 days'}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-slate-500">
                      {hasFilters
                        ? 'Try widening the date range or clearing the filters.'
                        : 'Widen the range to see older records, or run a CBC analysis and save it.'}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDays('')}
                        className="h-10 rounded-lg border-slate-200 px-4 text-[12.5px] font-bold shadow-none"
                      >
                        Show all time
                      </Button>
                      <Button
                        asChild
                        className="h-10 rounded-lg bg-blue-600 px-4 text-[12.5px] font-bold text-white shadow-none hover:bg-blue-700"
                      >
                        <Link to="/cbc-analyzer">
                          <BeakerIcon className="h-4 w-4" />
                          New analysis
                        </Link>
                      </Button>
                    </div>
                  </div>
                }
              />
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ── Stat tile ────────────────────────────────────────────────────────────── */

function StatTile({
  label,
  value,
  loading,
  change,
}: {
  label: string
  value: number | undefined
  loading: boolean
  change?: number | null
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-7 sm:px-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <div className="mt-3.5 flex items-baseline gap-2">
        {loading ? (
          <span className="inline-block h-8 w-14 animate-pulse rounded bg-slate-100" />
        ) : (
          <span className="text-[32px] font-extrabold leading-none tabular-nums text-slate-900">
            {value ?? 0}
          </span>
        )}
        {!loading && change !== null && change !== undefined ? (
          <span
            className={`text-[13px] font-bold ${
              change >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {change >= 0 ? '+' : '−'}
            {Math.abs(change)}%
          </span>
        ) : null}
      </div>
    </div>
  )
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div aria-hidden="true">
      <div className="bg-muted h-11" />
      <div className="divide-y divide-slate-100 px-6">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-5">
            <span className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <span className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <span className="h-3 w-16 animate-pulse rounded bg-slate-100" />
            <span className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <span className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default MedicalLogView
