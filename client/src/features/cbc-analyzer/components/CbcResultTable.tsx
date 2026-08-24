import * as React from 'react'
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
}

export function CbcResultTable({
  results,
  showUnitColumn = false,
}: CbcResultTableProps) {
  const grouped = React.useMemo(() => {
    const buckets = new Map<SeriesKey, Array<AnalyteResult>>()
    results.forEach((result) => {
      const bucket = buckets.get(result.series)
      if (bucket) bucket.push(result)
      else buckets.set(result.series, [result])
    })

    return SERIES_GROUPS.map((group) => ({
      key: group.key,
      label: group.label,
      rows: buckets.get(group.key) ?? [],
    })).filter((group) => group.rows.length > 0)
  }, [results])

  if (grouped.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-[12px] text-slate-500">
        No blood values were submitted for this record.
      </p>
    )
  }

  const headClass =
    'h-8 px-0 pr-3 text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400'

  return (
    <Table className="min-w-96">
      <TableHeader>
        <TableRow className="border-slate-100 hover:bg-transparent">
          <TableHead scope="col" className={headClass}>
            Parameter
          </TableHead>
          <TableHead scope="col" className={headClass}>
            Result
          </TableHead>
          {showUnitColumn ? (
            <TableHead scope="col" className={headClass}>
              Unit
            </TableHead>
          ) : null}
          <TableHead scope="col" className={headClass}>
            Reference range
          </TableHead>
          <TableHead scope="col" className={`${headClass} pr-0`}>
            Status
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
                className="h-auto px-0 pb-1.5 pt-4 text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400"
              >
                {group.label}
              </TableHead>
            </TableRow>
            {group.rows.map((row) => {
              const abnormal = row.status === 'low' || row.status === 'high'
              const unassessed = row.status === 'not_assessed'
              return (
                <TableRow
                  key={row.key}
                  className="border-slate-100 hover:bg-transparent"
                >
                  <th
                    scope="row"
                    className="px-0 py-2.5 pr-3 text-left align-middle text-[12px] font-bold text-slate-800"
                  >
                    {row.label}
                  </th>
                  <TableCell
                    className={`px-0 py-2.5 pr-3 text-[12px] font-bold tabular-nums ${
                      unassessed
                        ? 'text-slate-400'
                        : abnormal
                          ? 'text-slate-900'
                          : 'text-slate-800'
                    }`}
                  >
                    {row.value_label}
                  </TableCell>
                  {showUnitColumn ? (
                    <TableCell className="px-0 py-2.5 pr-3 text-[11.5px] text-slate-500">
                      {row.unit}
                    </TableCell>
                  ) : null}
                  <TableCell className="px-0 py-2.5 pr-3 text-[11.5px] tabular-nums text-slate-500">
                    {row.reference_label}
                  </TableCell>
                  <TableCell className="px-0 py-2.5">
                    <StatusPill status={row.status} />
                  </TableCell>
                </TableRow>
              )
            })}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  )
}
