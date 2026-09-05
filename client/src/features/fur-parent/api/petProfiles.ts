import { petsClient } from './petsClient'
import type {
  DocumentKind,
  FurParentDashboardData,
  MedicationDraft,
  PetDraft,
} from '../types'

export async function fetchDashboard(): Promise<FurParentDashboardData> {
  return petsClient.get<FurParentDashboardData>('/dashboard/')
}

export async function createPet(draft: PetDraft): Promise<{ id: number }> {
  return petsClient.post<{ id: number }>('/', {
    name: draft.name.trim(),
    species: draft.species,
    breed: draft.breed?.trim() ?? '',
    photo_url: draft.photoUrl?.trim() ?? '',
    birth_date: draft.birthDate || null,
    sex: draft.sex ?? 'unknown',
    neuter_status: draft.neuterStatus ?? 'unknown',
    ideal_weight_kg: draft.idealWeightKg || null,
    microchip_number: draft.microchipNumber?.trim() ?? '',
    insurance_provider: draft.insuranceProvider?.trim() ?? '',
    indoor_only: draft.indoorOnly ?? false,
  })
}

export async function deletePet(petId: string): Promise<void> {
  return petsClient.delete<void>(`/${petId}/`)
}

export async function logMedicationDose(
  medicationId: string,
  note = '',
): Promise<void> {
  return petsClient.post<void>(`/medications/${medicationId}/doses/`, { note })
}

export async function logWeight({
  petId,
  weightKg,
  recordedOn,
  note = '',
}: {
  petId: string
  weightKg: string
  recordedOn?: string
  note?: string
}): Promise<void> {
  return petsClient.post<void>(`/${petId}/weights/`, {
    weight_kg: weightKg,
    ...(recordedOn ? { recorded_on: recordedOn } : {}),
    note,
  })
}

export async function uploadDocument({
  petId,
  label,
  kind,
  file,
  note = '',
}: {
  petId: string
  label: string
  kind: DocumentKind
  file: File
  note?: string
}): Promise<void> {
  const body = new FormData()
  body.set('label', label.trim())
  body.set('kind', kind)
  body.set('file', file)
  body.set('note', note.trim())
  return petsClient.post<void>(`/${petId}/documents/`, body)
}

export async function addVaccination({
  petId,
  name,
  administeredOn,
  dueOn,
  clinic = '',
}: {
  petId: string
  name: string
  administeredOn?: string | null
  dueOn?: string | null
  clinic?: string
}): Promise<void> {
  return petsClient.post<void>(`/${petId}/vaccinations/`, {
    name: name.trim(),
    administered_on: administeredOn || null,
    due_on: dueOn || null,
    clinic: clinic.trim(),
  })
}

export async function updatePet({
  petId,
  ...fields
}: {
  petId: string
  name?: string
  breed?: string
  photoUrl?: string
  birthDate?: string | null
  sex?: PetDraft['sex']
  neuterStatus?: PetDraft['neuterStatus']
  idealWeightKg?: string | null
  microchipNumber?: string
  insuranceProvider?: string
  indoorOnly?: boolean
  favourite?: boolean
}): Promise<void> {
  const body: Record<string, unknown> = {}

  if (fields.name !== undefined) body.name = fields.name.trim()
  if (fields.breed !== undefined) body.breed = fields.breed.trim()
  if (fields.photoUrl !== undefined) body.photo_url = fields.photoUrl.trim()
  if (fields.birthDate !== undefined) body.birth_date = fields.birthDate || null
  if (fields.sex !== undefined) body.sex = fields.sex
  if (fields.neuterStatus !== undefined) {
    body.neuter_status = fields.neuterStatus
  }
  if (fields.idealWeightKg !== undefined) {
    body.ideal_weight_kg = fields.idealWeightKg || null
  }
  if (fields.microchipNumber !== undefined) {
    body.microchip_number = fields.microchipNumber.trim()
  }
  if (fields.insuranceProvider !== undefined) {
    body.insurance_provider = fields.insuranceProvider.trim()
  }
  if (fields.indoorOnly !== undefined) body.indoor_only = fields.indoorOnly
  if (fields.favourite !== undefined) body.is_favourite = fields.favourite

  return petsClient.patch<void>(`/${petId}/`, body)
}

export async function addMedication({
  petId,
  draft,
}: {
  petId: string
  draft: MedicationDraft
}): Promise<void> {
  return petsClient.post<void>(`/${petId}/medications/`, {
    name: draft.name.trim(),
    detail: draft.detail?.trim() ?? '',
    form: draft.form,
    cadence: draft.cadence,
    next_due_on: draft.nextDueOn || null,
  })
}

export async function rescheduleAppointment({
  appointmentId,
  startsAt,
}: {
  appointmentId: string
  startsAt: string
}): Promise<void> {
  return petsClient.patch<void>(`/appointments/${appointmentId}/`, {
    starts_at: startsAt,
  })
}
