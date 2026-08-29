import { Link } from '@tanstack/react-router'
import {
  ArrowPathIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/solid'

import { Button } from '@/components/ui/button'
import { StatusPill } from '@/features/cbc-analyzer/components/StatusPill'
import { formatDate } from '@/features/cbc-analyzer/utils/format'
import type { MedicalLogListItem } from '@/features/cbc-analyzer/types'

type RecentRecordsCardProps = {
  records: Array<MedicalLogListItem>
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

export function RecentRecordsCard({
  records,
  isLoading,
  error,
  onRetry,
}: RecentRecordsCardProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[14px] font-bold tracking-tight text-slate-900">
            Recent analyses
          </h2>
          <p className="mt-0.5 text-[11.5px] text-slate-400">
            Your most recently saved CBC records
          </p>
        </div>
        <Link
          to="/medical-log"
          className="shrink-0 text-[12.5px] font-bold text-blue-600 transition hover:text-blue-700"
        >
          View all
        </Link>
      </header>

      {error ? (
        <div className="px-5 py-12 text-center">
          <p className="text-[13px] font-bold text-slate-800">
            We could not load your records
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] text-slate-500">
            {error.message}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="mt-4 h-9 rounded-lg border-slate-200 px-4 text-[12.5px] font-bold shadow-none"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <ul className="divide-y divide-slate-100" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-slate-100" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-44 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
            </li>
          ))}
        </ul>
      ) : records.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ClipboardDocumentListIcon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[13px] font-bold text-slate-800">
            No saved records yet
          </p>
          <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-slate-500">
            Run a CBC through the analyzer and save it — it will show up here
            and in your medical log.
          </p>
          <Button
            asChild
            className="mt-4 h-9 rounded-lg bg-blue-600 px-4 text-[12.5px] font-bold text-white shadow-none hover:bg-blue-700"
          >
            <Link to="/cbc-analyzer">
              <BeakerIcon className="h-4 w-4" />
              New analysis
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {records.map((record) => (
            <li key={record.record_id}>
              <Link
                to="/medical-log/$recordId"
                params={{ recordId: record.record_id }}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-extrabold text-slate-500 uppercase">
                  {(record.pet_name || '?').charAt(0)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-slate-900">
                    {record.pet_name || 'Unnamed patient'}
                  </p>
                  <p className="truncate text-[11.5px] text-slate-400">
                    {record.species_display}
                    {record.breed ? ` · ${record.breed}` : ''} ·{' '}
                    {formatDate(record.test_date)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  {record.flag_count > 0 ? (
                    <span className="hidden text-[11.5px] font-semibold text-slate-400 tabular-nums sm:block">
                      {record.flag_count} flag
                      {record.flag_count === 1 ? '' : 's'}
                    </span>
                  ) : null}
                  <StatusPill status={record.result_status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
