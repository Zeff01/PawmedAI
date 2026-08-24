import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MedicalLogPagination } from './MedicalLogPagination'

type MedicalLogTableProps<TData> = {
  columns: Array<ColumnDef<TData>>
  data: Array<TData>
  rowCount: number
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  emptyState: React.ReactNode
  summary: React.ReactNode
}

export function MedicalLogTable<TData>({
  columns,
  data,
  rowCount,
  pagination,
  onPaginationChange,
  emptyState,
  summary,
}: MedicalLogTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    rowCount,
    pageCount: Math.max(1, Math.ceil(rowCount / pagination.pageSize)),
    state: { pagination },
    onPaginationChange,
  })

  const rows = table.getRowModel().rows

  return (
    <>
      <Table className="min-w-208">
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-muted">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} scope="col" className="h-11 px-6">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className="border-slate-100 hover:bg-slate-50/70"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-6 py-5 align-middle whitespace-normal"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {rows.length > 0 ? (
        <div className="border-t border-slate-100 px-4 py-4">
          <MedicalLogPagination table={table} summary={summary} />
        </div>
      ) : null}
    </>
  )
}
