import { Link } from '@tanstack/react-router'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  EyeIcon,
} from '@heroicons/react/24/solid'
import type { ColumnDef } from '@tanstack/react-table'
import { StatusPill } from './StatusPill'
import { formatDate } from '../utils/format'
import type { MedicalLogListItem } from '../types'

type RowActions = {
  downloadingId: string | null
  onDownload: (recordId: string) => void
}

const CELL_TEXT = 'text-[13px] text-slate-700'

export function buildMedicalLogColumns({
  downloadingId,
  onDownload,
}: RowActions): Array<ColumnDef<MedicalLogListItem>> {
  return [
    {
      accessorKey: 'test_date',
      header: 'Date',
      cell: ({ row }) => (
        <span className={CELL_TEXT}>{formatDate(row.original.test_date)}</span>
      ),
    },
    {
      accessorKey: 'pet_name',
      header: 'Pet name',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5">
          <Link
            to="/medical-log/$recordId"
            params={{ recordId: row.original.record_id }}
            className="text-[13px] text-slate-700 underline-offset-2 hover:text-blue-700 hover:underline"
          >
            {row.original.pet_name || 'Unlinked record'}
          </Link>
          {row.original.pet_id === null ? (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
              No profile
            </span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: 'species_display',
      header: 'Species',
      cell: ({ row }) => (
        <span className={CELL_TEXT}>{row.original.species_display}</span>
      ),
    },
    {
      accessorKey: 'breed',
      header: 'Breed',
      cell: ({ row }) => (
        <span className={CELL_TEXT}>{row.original.breed || '—'}</span>
      ),
    },
    {
      accessorKey: 'test_type',
      header: 'Test type',
      cell: ({ row }) => (
        <span className={CELL_TEXT}>
          {row.original.test_type === 'cbc_panel'
            ? 'CBC panel'
            : row.original.test_type}
        </span>
      ),
    },
    {
      accessorKey: 'key_findings',
      header: 'Key findings',
      cell: ({ row }) => (
        <span className={`line-clamp-2 ${CELL_TEXT}`}>
          {row.original.key_findings || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'result_status',
      header: 'Status',
      cell: ({ row }) => <StatusPill status={row.original.result_status} />,
    },
    {
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      enableHiding: false,
      cell: ({ row }) => {
        const record = row.original
        const label = record.pet_name || record.record_id
        const isDownloading = downloadingId === record.record_id
        return (
          <div className="flex items-center justify-end gap-2">
            <Link
              to="/medical-log/$recordId"
              params={{ recordId: record.record_id }}
              aria-label={`Open the record for ${label}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <EyeIcon className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => onDownload(record.record_id)}
              disabled={isDownloading}
              aria-label={`Download the record for ${label} as a PDF`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {isDownloading ? (
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )
      },
    },
  ]
}
