import { formatDate } from './format'
import { STATUS_STYLES } from '../constants'
import type { MedicalLogListItem } from '../types'

function cell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

const HEADERS = [
  'Record ID',
  'Date',
  'Pet Name',
  'Species',
  'Breed',
  'Test Type',
  'Key Findings',
  'Status',
  'Flags',
]

export function buildMedicalLogCsv(rows: Array<MedicalLogListItem>): string {
  const lines = [HEADERS.map(cell).join(',')]
  rows.forEach((row) => {
    lines.push(
      [
        row.record_id,
        formatDate(row.test_date),
        row.pet_name || 'Unlinked record',
        row.species_display,
        row.breed,
        row.test_type === 'cbc_panel' ? 'CBC panel' : row.test_type,
        row.key_findings,
        STATUS_STYLES[row.result_status].label,
        row.flag_count,
      ]
        .map(cell)
        .join(','),
    )
  })

  return `\uFEFF${lines.join('\r\n')}\r\n`
}

export function downloadCsv(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
