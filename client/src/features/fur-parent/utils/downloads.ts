import type {
  AppointmentRecord,
  FurParentPet,
  PetWellness,
  VaccinationRecord,
} from '../types'

const DEFAULT_VISIT_MINUTES = 60

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function toIcsLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  )
}

function toIcsUtc(date: Date) {
  return `${date.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'pet'
  )
}

export function downloadAppointmentInvite({
  appointment,
  petName,
  sampleData = false,
}: {
  appointment: AppointmentRecord
  petName: string
  sampleData?: boolean
}) {
  const start = new Date(appointment.startsAt)
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Unusable appointment date: ${appointment.startsAt}`)
  }

  const end = new Date(start.getTime() + DEFAULT_VISIT_MINUTES * 60_000)
  const description = [
    `${appointment.vetName} · ${appointment.vetRole}`,
    appointment.clinic,
    sampleData
      ? 'Added from Pawmed AI sample content — this is not a confirmed booking.'
      : 'Added from Pawmed AI.',
  ].join('\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pawmed AI//Fur Parent//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${slugify(petName)}-${toIcsLocal(start)}@pawmed.ai`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsLocal(start)}`,
    `DTEND:${toIcsLocal(end)}`,
    `SUMMARY:${escapeIcsText(
      `${petName} — ${appointment.title}${sampleData ? ' (sample)' : ''}`,
    )}`,
    `LOCATION:${escapeIcsText(`${appointment.clinic}, ${appointment.address}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`${petName}'s vet visit is tomorrow`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  saveBlob(
    new Blob([`${lines.join('\r\n')}\r\n`], {
      type: 'text/calendar;charset=utf-8',
    }),
    `${slugify(petName)}-vet-appointment.ics`,
  )
}

export async function downloadVaccinationRecord({
  petName,
  breed,
  ageLabel,
  syncedLabel,
  statusLabel,
  records,
  sampleData = false,
}: {
  petName: string
  breed: string
  ageLabel: string
  syncedLabel: string
  statusLabel: string
  records: Array<VaccinationRecord>
  sampleData?: boolean
}) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 48
  const contentWidth = pageWidth - margin * 2

  /* ── Header ── */
  pdf.setFillColor(12, 62, 44)
  pdf.rect(0, 0, pageWidth, 104, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('Pawmed AI — Vaccine record', margin, 50)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(
    `Prepared ${new Date().toLocaleDateString()} · ${syncedLabel}`,
    margin,
    74,
  )

  let y = 148

  if (sampleData) {
    pdf.setFillColor(255, 251, 235) // amber-50
    pdf.rect(margin, y - 26, contentWidth, 40, 'F')
    pdf.setTextColor(180, 83, 9) // amber-700
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('SAMPLE CONTENT — NOT AN OFFICIAL CERTIFICATE', margin + 12, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(
      'Generated from placeholder records while pet profiles are being built.',
      margin + 12,
      y + 14,
    )
    y += 66
  }

  /* ── Patient ── */
  pdf.setTextColor(20, 20, 20)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text(petName, margin, y)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(90, 90, 90)
  pdf.text(`${breed} · ${ageLabel}`, margin, y + 16)
  pdf.text(`Vaccines: ${statusLabel}`, margin, y + 30)

  y += 62

  /* ── Records ── */
  pdf.setDrawColor(224, 224, 224)
  pdf.line(margin, y, margin + contentWidth, y)
  y += 24

  for (const record of records) {
    pdf.setTextColor(20, 20, 20)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(record.name, margin, y)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    if (record.state === 'overdue') pdf.setTextColor(190, 18, 60)
    else if (record.state === 'upcoming') pdf.setTextColor(180, 83, 9)
    else pdf.setTextColor(15, 78, 55)
    pdf.text(record.validity, margin + contentWidth, y, { align: 'right' })

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(90, 90, 90)
    pdf.setFontSize(10)
    for (const line of pdf.splitTextToSize(record.detail, contentWidth - 80)) {
      y += 14
      pdf.text(line, margin, y)
    }

    y += 26
  }

  /* ── Footer ── */
  pdf.setFontSize(8)
  pdf.setTextColor(130, 130, 130)
  pdf.text(
    'Pawmed AI helps you keep track of your pet — it does not issue official ' +
      'certificates. Ask your vet for the official copy.',
    margin,
    pdf.internal.pageSize.getHeight() - 40,
    { maxWidth: contentWidth },
  )

  saveBlob(pdf.output('blob'), `${slugify(petName)}-vaccination-record.pdf`)
}

export function householdSummaryText({
  ownerName,
  pets,
  wellnessByPet,
}: {
  ownerName: string
  pets: Array<FurParentPet>
  wellnessByPet: Record<string, PetWellness>
}): string {
  const lines = [
    `Pawmed AI — care summary for ${ownerName}`,
    `Prepared ${new Date().toLocaleDateString()}`,
  ]

  if (pets.length === 0) {
    lines.push('', 'No pets on this account yet.')
  }

  for (const pet of pets) {
    const wellness = wellnessByPet[pet.id]
    lines.push('', `${pet.name} — ${pet.breed} · ${pet.ageLabel}`)
    lines.push(`  Weight: ${pet.weightLabel}`)
    lines.push(`  Last visit: ${pet.lastCheckupLabel}`)
    lines.push(`  Immunisation: ${wellness.vaccinations.status.label}`)
    for (const record of wellness.vaccinations.records) {
      lines.push(`    · ${record.name} — ${record.validity}`)
    }

    if (wellness.medications.records.length > 0) {
      lines.push('  Medications:')
      for (const record of wellness.medications.records) {
        lines.push(`    · ${record.name} — ${record.cadence} (${record.note})`)
      }
    }

    if (wellness.appointment) {
      lines.push(
        `  Next visit: ${wellness.appointment.when} · ` +
          `${wellness.appointment.clinic}`,
      )
    }
  }

  lines.push(
    '',
    "Shared from Pawmed AI — a caregiver's record, not a veterinary " +
      'certificate.',
  )

  return lines.join('\n')
}
