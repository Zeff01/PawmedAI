import type { CareTone, FurParentPet, PetWellness } from './types'

export type CarePriority = {
  id: string
  tone: CareTone
  icon: 'syringe' | 'pill' | 'calendar' | 'activity'
  title: string
  detail: string
}

const URGENCY: Record<CareTone, number> = {
  secondary: 0,
  tertiary: 1,
  neutral: 2,
  primary: 3,
}

export function collectCarePriorities(
  wellness: PetWellness,
): Array<CarePriority> {
  const priorities: Array<CarePriority> = []

  const vitals = wellness.vitals
  const flagged =
    vitals.status.tone === 'secondary' || vitals.status.tone === 'tertiary'
  const leadMetric = vitals.metrics.at(0)
  const vitalsDetail = vitals.gauge
    ? { title: vitals.gauge.label, detail: vitals.gauge.readout }
    : leadMetric
      ? {
          title: leadMetric.label,
          detail: `${leadMetric.value} ${leadMetric.unit} · ${leadMetric.note}`,
        }
      : null
  if (flagged && vitalsDetail) {
    priorities.push({
      id: 'vitals',
      tone: vitals.status.tone,
      icon: 'activity',
      ...vitalsDetail,
    })
  }

  for (const record of wellness.vaccinations.records) {
    if (record.state === 'active') continue
    priorities.push({
      id: `vaccination-${record.name}`,
      tone:
        record.state === 'overdue' ||
        wellness.vaccinations.status.tone === 'secondary'
          ? 'secondary'
          : 'tertiary',
      icon: 'syringe',
      title: record.name,
      detail: record.detail,
    })
  }

  for (const record of wellness.medications.records) {
    if (record.noteTone === 'primary') continue
    priorities.push({
      id: `medication-${record.name}`,
      tone: 'tertiary',
      icon: 'pill',
      title: record.name,
      detail: record.note,
    })
  }

  if (wellness.appointment) {
    priorities.push({
      id: 'appointment',
      tone: 'neutral',
      icon: 'calendar',
      title: wellness.appointment.title,
      detail: wellness.appointment.when,
    })
  }

  return priorities.sort((a, b) => URGENCY[a.tone] - URGENCY[b.tone])
}

export type PetCareSummary = {
  petId: string
  petName: string
  top: CarePriority | null
  extra: number
}

export function summariseHousehold(
  pets: Array<FurParentPet>,
  wellnessByPet: Record<string, PetWellness>,
): Array<PetCareSummary> {
  return pets.map((pet) => {
    const priorities = collectCarePriorities(wellnessByPet[pet.id])

    return {
      petId: pet.id,
      petName: pet.name,
      top: priorities[0] ?? null,
      extra: Math.max(priorities.length - 1, 0),
    }
  })
}

export type HouseholdHighlights = {
  nextVisit: { petName: string; when: string; clinic: string } | null
  protection: { inForce: number; total: number }
  scans: number
  medications: number
}

export function summariseHighlights(
  pets: Array<FurParentPet>,
  wellnessByPet: Record<string, PetWellness>,
): HouseholdHighlights {
  const highlights: HouseholdHighlights = {
    nextVisit: null,
    protection: { inForce: 0, total: 0 },
    scans: 0,
    medications: 0,
  }

  let soonest: string | null = null

  for (const pet of pets) {
    const wellness = wellnessByPet[pet.id]
    const { appointment } = wellness
    if (appointment && (soonest === null || appointment.startsAt < soonest)) {
      soonest = appointment.startsAt
      highlights.nextVisit = {
        petName: pet.name,
        when: appointment.when,
        clinic: appointment.clinic,
      }
    }

    highlights.protection.total += wellness.vaccinations.records.length
    highlights.protection.inForce += wellness.vaccinations.records.filter(
      (record) => record.state === 'active',
    ).length

    highlights.scans += wellness.screening?.totalScans ?? 0
    highlights.medications += wellness.medications.records.length
  }

  return highlights
}

export type DueDose = {
  medicationId: string
  medicationName: string
  petId: string
  petName: string
  note: string
}

export function collectDueDoses(
  pets: Array<FurParentPet>,
  wellnessByPet: Record<string, PetWellness>,
): Array<DueDose> {
  const doses: Array<DueDose> = []

  for (const pet of pets) {
    for (const record of wellnessByPet[pet.id].medications.records) {
      if (record.noteTone === 'primary') continue
      doses.push({
        medicationId: record.id,
        medicationName: record.name,
        petId: pet.id,
        petName: pet.name,
        note: record.note,
      })
    }
  }

  return doses
}
