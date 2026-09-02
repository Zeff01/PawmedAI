import * as React from 'react'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/solid'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SERIES_GROUPS } from '../constants'
import { StatusPill } from './StatusPill'
import type { AnalyteResult, SeriesKey } from '../types'

type CbcResultTableProps = {
  results: Array<AnalyteResult>
  showUnitColumn?: boolean
  /** Hide the in-range rows — the point of a 15-row panel is its exceptions. */
  onlyFlagged?: boolean
}

function isFlagged(result: AnalyteResult) {
  return result.status === 'low' || result.status === 'high'
}

/**
 * The direction of a miss, as a glyph beside the value.
 *
 * Status colour alone cannot carry this: it fails for colour-blind readers and
 * in print. The pill's word says what, the arrow says which way, and the value
 * itself stays in ink.
 */
function DirectionMark({ status }: { status: AnalyteResult['status'] }) {
  if (status === 'high')
    return (
      <ArrowUpIcon
        aria-hidden="true"
        className="h-3 w-3 shrink-0 text-amber-500"
      />
    )
  if (status === 'low')
    return (
      <ArrowDownIcon
        aria-hidden="true"
        className="h-3 w-3 shrink-0 text-red-500"
      />
    )
  return null
}

export function CbcResultTable({
  results,
  showUnitColumn = false,
  onlyFlagged = false,
}: CbcResultTableProps) {
  const grouped = React.useMemo(() => {
    const visible = onlyFlagged ? results.filter(isFlagged) : results
    const buckets = new Map<SeriesKey, Array<AnalyteResult>>()
    visible.forEach((result) => {
      const bucket = buckets.get(result.series)
      if (bucket) bucket.push(result)
      else buckets.set(result.series, [result])
    })

    return SERIES_GROUPS.map((group) => {
      const rows = buckets.get(group.key) ?? []
      return {
        key: group.key,
        label: group.shortLabel || group.label,
        rows,
        flagged: rows.filter(isFlagged).length,
      }
    }).filter((group) => group.rows.length > 0)
  }, [results, onlyFlagged])

  if (grouped.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-[12px] text-slate-500">
        {onlyFlagged
          ? 'Every submitted value is inside its reference interval.'
          : 'No blood values were submitted for this record.'}
      </p>
    )
  }

  const headClass =
    'h-8 px-0 pr-4 text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400'

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-136">
        <TableHeader>
          <TableRow className="border-slate-200 hover:bg-transparent">
            {/* pl-3 leaves room for the accent bar that marks a flagged row */}
            <TableHead scope="col" className={`${headClass} pl-3`}>
              Parameter
            </TableHead>
            <TableHead scope="col" className={`${headClass} text-right`}>
              Result
            </TableHead>
            {showUnitColumn ? (
              <TableHead scope="col" className={headClass}>
                Unit
              </TableHead>
            ) : null}
            <TableHead scope="col" className={headClass}>
              Status
            </TableHead>
            <TableHead scope="col" className={`${headClass} pr-0`}>
              Reference interval
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grouped.map((group) => (
            <React.Fragment key={group.key}>
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead
                  scope="colgroup"
                  colSpan={showUnitColumn ? 5 : 4}
                  className="h-auto px-0 pb-2 pl-3 pt-5 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500"
                >
                  {group.label}
                  {group.flagged > 0 ? (
                    <span className="ml-2 font-bold normal-case tracking-normal text-slate-400">
                      {group.flagged} flagged
                    </span>
                  ) : null}
                </TableHead>
              </TableRow>
              {group.rows.map((row) => {
                const flagged = isFlagged(row)
                const unassessed = row.status === 'not_assessed'
                return (
                  <TableRow
                    key={row.key}
                    /* The accent is the scanning cue: a flagged parameter is
                       findable from the left edge, without reading across to
                       the status column. */
                    className={`border-slate-100 hover:bg-slate-50/60 ${
                      flagged
                        ? row.status === 'low'
                          ? 'border-l-2 border-l-red-400 bg-red-50/25'
                          : 'border-l-2 border-l-amber-400 bg-amber-50/25'
                        : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <th
                      scope="row"
                      className={`py-2.5 pl-3 pr-4 text-left align-middle text-[12.5px] ${
                        flagged
                          ? 'font-extrabold text-slate-900'
                          : 'font-semibold text-slate-700'
                      }`}
                    >
                      {row.label}
                    </th>
                    <TableCell className="px-0 py-2.5 pr-4 text-right">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <DirectionMark status={row.status} />
                        <span
                          className={`text-[13px] tabular-nums ${
                            unassessed
                              ? 'font-semibold text-slate-400'
                              : flagged
                                ? 'font-extrabold text-slate-900'
                                : 'font-bold text-slate-700'
                          }`}
                        >
                          {row.value_label}
                        </span>
                      </span>
                    </TableCell>
                    {showUnitColumn ? (
                      <TableCell className="px-0 py-2.5 pr-4 text-[11.5px] text-slate-500">
                        {row.unit}
                      </TableCell>
                    ) : null}
                    <TableCell className="px-0 py-2.5 pr-4">
                      <StatusPill status={row.status} />
                    </TableCell>
                    <TableCell className="px-0 py-2.5 text-[11.5px] tabular-nums text-slate-500">
                      {row.reference_label}
                    </TableCell>
                  </TableRow>
                )
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
