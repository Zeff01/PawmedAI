import {
  SERIES_GROUPS,
  SAMPLE_QUALITY_OPTIONS,
  STATUS_STYLES,
} from '../constants'
import { describeSexAndStatus, formatAgeLong, formatDate } from './format'
import type {
  AnalyteResult,
  CbcAnalysis,
  MedicalLogDetail,
  SampleQualityFlag,
  SeriesKey,
} from '../types'

export type CbcPdfInput = {
  recordId: string | null
  petName: string
  ownerName: string
  speciesDisplay: string
  breed: string
  ageYears: number | string | null
  sex: MedicalLogDetail['sex']
  neuterStatus: MedicalLogDetail['neuter_status']
  testDate: string | null
  resultStatus: keyof typeof STATUS_STYLES
  flagCount: number
  keyFindings: string
  diagnosticBrief: string
  clinicalNotes: string
  sampleQuality: Array<SampleQualityFlag>
  smearMorphology: string
  vetName: string
  results: Array<AnalyteResult>
}

/** Normalise a fresh analysis into the shared PDF shape. */
export function analysisToPdfInput(analysis: CbcAnalysis): CbcPdfInput {
  return {
    recordId: null,
    petName: analysis.patient.pet_name,
    ownerName: analysis.patient.owner_name,
    speciesDisplay: analysis.patient.species_display,
    breed: analysis.patient.breed,
    ageYears: analysis.patient.age_years,
    sex: analysis.patient.sex,
    neuterStatus: analysis.patient.neuter_status,
    testDate: new Date().toISOString().slice(0, 10),
    resultStatus: analysis.result_status,
    flagCount: analysis.flag_count,
    keyFindings: analysis.key_findings,
    diagnosticBrief: analysis.diagnostic_brief,
    clinicalNotes: analysis.clinical_notes,
    sampleQuality: analysis.sample_quality,
    smearMorphology: analysis.smear_morphology,
    vetName: '',
    results: analysis.results,
  }
}

/** Normalise a saved record into the shared PDF shape. */
export function logToPdfInput(log: MedicalLogDetail): CbcPdfInput {
  return {
    recordId: log.record_id,
    petName: log.pet_name,
    ownerName: log.owner_name,
    speciesDisplay: log.species_display,
    breed: log.breed,
    ageYears: log.age_years,
    sex: log.sex,
    neuterStatus: log.neuter_status,
    testDate: log.test_date,
    resultStatus: log.result_status,
    flagCount: log.flag_count,
    keyFindings: log.key_findings,
    diagnosticBrief: log.diagnostic_brief,
    clinicalNotes: log.clinical_notes,
    sampleQuality: log.sample_quality,
    smearMorphology: log.smear_morphology,
    vetName: log.vet_name,
    results: log.evaluation.results ?? [],
  }
}

/**
 * Render a CBC record as a PDF and open it in a new tab.
 */
export async function downloadCbcPdf(input: CbcPdfInput) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 40
  const contentWidth = pageWidth - margin * 2

  /* ── Header banner ── */
  pdf.setFillColor(24, 70, 200)
  pdf.rect(0, 0, pageWidth, 108, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(17)
  pdf.text('Pawmed AI — CBC Analysis Report', margin, 44)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9.5)
  pdf.setTextColor(214, 228, 255)
  pdf.text('Complete blood count · veterinary decision support', margin, 62)

  const statusLabel = STATUS_STYLES[input.resultStatus].label.toUpperCase()
  const badge = `${statusLabel}${
    input.flagCount > 0
      ? ` · ${input.flagCount} ${input.flagCount === 1 ? 'FLAG' : 'FLAGS'}`
      : ''
  }`
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(255, 255, 255)
  pdf.text(badge, pageWidth - margin - pdf.getTextWidth(badge), 44)
  if (input.recordId) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(214, 228, 255)
    pdf.text(
      input.recordId,
      pageWidth - margin - pdf.getTextWidth(input.recordId),
      62,
    )
  }

  let cursorY = 132

  const ensureSpace = (height: number) => {
    if (cursorY + height > pageHeight - margin) {
      pdf.addPage()
      cursorY = margin
    }
  }

  const addHeading = (text: string) => {
    ensureSpace(30)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(24, 70, 200)
    pdf.text(text.toUpperCase(), margin, cursorY)
    cursorY += 15
  }

  const addParagraph = (text: string) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(60, 70, 85)
    const lines = pdf.splitTextToSize(text, contentWidth)
    ensureSpace(lines.length * 13 + 8)
    pdf.text(lines, margin, cursorY)
    cursorY += lines.length * 13 + 10
  }

  /* ── Patient & test summary ── */
  addHeading('Patient summary')
  const summaryRows: Array<[string, string]> = [
    ['Patient', input.petName || 'Unnamed patient'],
    ['Owner', input.ownerName || 'Not recorded'],
    ['Species', input.speciesDisplay || 'Not recorded'],
    ['Breed', input.breed || 'Not recorded'],
    ['Age', formatAgeLong(input.ageYears)],
    ['Sex', describeSexAndStatus(input.sex, input.neuterStatus)],
    ['Analysis date', formatDate(input.testDate)],
    ['Attending vet', input.vetName || 'Not recorded'],
  ]

  pdf.setFontSize(9.5)
  const columnWidth = contentWidth / 2
  summaryRows.forEach(([label, value], index) => {
    const column = index % 2
    if (column === 0) ensureSpace(16)
    const x = margin + column * columnWidth
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(140, 150, 165)
    pdf.text(`${label}:`, x, cursorY)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(40, 50, 65)
    pdf.text(
      pdf.splitTextToSize(value, columnWidth - 74)[0] ?? value,
      x + 72,
      cursorY,
    )
    if (column === 1 || index === summaryRows.length - 1) cursorY += 15
  })
  cursorY += 8

  /* ── Narrative ── */
  if (input.keyFindings) {
    addHeading('Key findings')
    addParagraph(input.keyFindings)
  }
  if (input.diagnosticBrief) {
    addHeading('Diagnostic brief')
    addParagraph(input.diagnosticBrief)
  }

  /* ── Results tables ── */
  const bySeries = new Map<SeriesKey, Array<AnalyteResult>>()
  input.results.forEach((result) => {
    const bucket = bySeries.get(result.series)
    if (bucket) bucket.push(result)
    else bySeries.set(result.series, [result])
  })

  const columns = [
    { label: 'Parameter', x: margin, width: 150 },
    { label: 'Result', x: margin + 160, width: 70 },
    { label: 'Unit', x: margin + 235, width: 70 },
    { label: 'Reference range', x: margin + 310, width: 120 },
    { label: 'Status', x: margin + 440, width: 70 },
  ]

  addHeading('Blood analysis results')
  SERIES_GROUPS.forEach((group) => {
    const rows = bySeries.get(group.key)
    if (!rows || rows.length === 0) return

    ensureSpace(44)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.setTextColor(90, 100, 120)
    pdf.text(group.label.toUpperCase(), margin, cursorY)
    cursorY += 13

    pdf.setFontSize(7.5)
    pdf.setTextColor(150, 160, 175)
    columns.forEach((column) =>
      pdf.text(column.label.toUpperCase(), column.x, cursorY),
    )
    cursorY += 5
    pdf.setDrawColor(228, 233, 240)
    pdf.line(margin, cursorY, pageWidth - margin, cursorY)
    cursorY += 11

    rows.forEach((row) => {
      ensureSpace(15)
      const abnormal = row.status !== 'normal'
      pdf.setFontSize(9)
      pdf.setFont('helvetica', abnormal ? 'bold' : 'normal')
      pdf.setTextColor(50, 60, 75)
      pdf.text(
        pdf.splitTextToSize(row.label, columns[0].width)[0] ?? row.label,
        columns[0].x,
        cursorY,
      )
      pdf.text(row.value_label, columns[1].x, cursorY)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(120, 130, 145)
      pdf.text(row.unit, columns[2].x, cursorY)
      pdf.text(
        row.reference_label.replace(` ${row.unit}`, ''),
        columns[3].x,
        cursorY,
      )
      if (row.status === 'high') pdf.setTextColor(190, 40, 40)
      else if (row.status === 'low') pdf.setTextColor(180, 110, 10)
      else pdf.setTextColor(20, 140, 90)
      pdf.setFont('helvetica', 'bold')
      pdf.text(
        STATUS_STYLES[row.status].label.toUpperCase(),
        columns[4].x,
        cursorY,
      )
      cursorY += 14
    })
    cursorY += 8
  })

  /* ── Supporting context ── */
  if (input.sampleQuality.length > 0) {
    addHeading('Sample quality')
    addParagraph(
      input.sampleQuality
        .map(
          (flag) =>
            SAMPLE_QUALITY_OPTIONS.find((option) => option.value === flag)
              ?.label ?? flag,
        )
        .join(', '),
    )
  }
  if (input.smearMorphology) {
    addHeading('Blood smear / morphology')
    addParagraph(input.smearMorphology)
  }
  if (input.clinicalNotes) {
    addHeading('Clinical notes & interpretation')
    addParagraph(input.clinicalNotes)
  }

  /* ── Footer disclaimer on every page ── */
  const disclaimer =
    'AI-assisted decision support. Reference intervals are species-specific defaults and may differ from your analyser. Correlate with the patient before acting.'
  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(150, 160, 175)
    const lines = pdf.splitTextToSize(disclaimer, contentWidth)
    pdf.text(lines, margin, pageHeight - 32)
    pdf.text(
      `${page} / ${pageCount}`,
      pageWidth - margin - pdf.getTextWidth(`${page} / ${pageCount}`),
      pageHeight - 20,
    )
  }

  const blobUrl = pdf.output('bloburl')
  window.open(blobUrl, '_blank', 'noopener,noreferrer')
}
