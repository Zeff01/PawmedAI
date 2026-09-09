import {
  CheckCircleIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/react/24/solid'

import { UploadCareComponent } from '@/components/UploadCareComponent'
import type { UploadedFile } from '@/components/UploadCareComponent'
import { formatBytes } from '@/utils/format-bytes'
import { MAX_REPORT_MB } from '../constants'

type CbcReportUploadProps = {
  file: UploadedFile | null
  onUpload: (file: UploadedFile) => void
  onRemove: () => void
}

/**
 * Attach the photographed CBC report.
 *
 * Picking, dragging, the camera and the progress bar all belong to the
 * Uploadcare widget now; what stays here is the confirmation card, because the
 * reader needs to see which image the brief will be read from before they
 * commit to it.
 */
export function CbcReportUpload({
  file,
  onUpload,
  onRemove,
}: CbcReportUploadProps) {
  /* ── A report is attached ─────────────────────────────────────────────── */
  if (file) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="relative max-h-72 overflow-hidden bg-slate-100">
          <img
            src={file.url}
            alt={`Preview of ${file.name}`}
            className="h-full max-h-72 w-full object-contain"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <DocumentTextIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[12px] font-semibold text-slate-700">
                {file.name}
              </p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Ready
              </span>
            </div>
            <p className="mt-1 text-[10.5px] text-slate-400">
              {formatBytes(file.size)} · ready to be read
            </p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove the report image"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:outline-none"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>
    )
  }

  /* ── Empty state ──────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
        <DocumentTextIcon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-[14px] font-extrabold text-slate-800">
          Upload CBC report
        </p>
        <p className="mt-0.5 text-[12px] text-slate-500">
          PNG, JPG, or WEBP · up to {MAX_REPORT_MB} MB
        </p>
      </div>

      <UploadCareComponent
        imgOnly
        sourceList="local, camera, url"
        maxSizeMb={MAX_REPORT_MB}
        onUploadOne={onUpload}
      />

      <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
        We read the printed values off the report. Check them against the paper
        before you rely on the brief.
      </p>
    </div>
  )
}
