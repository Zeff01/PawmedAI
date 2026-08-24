import { cbcClient, toQuery } from './cbcClient'
import type {
  CbcAnalysis,
  MedicalLogDetail,
  MedicalLogFilters,
  MedicalLogListItem,
  MedicalLogSummary,
  Paginated,
} from '../types'

export async function fetchMedicalLogs(
  filters: MedicalLogFilters = {},
): Promise<Paginated<MedicalLogListItem>> {
  return cbcClient.get<Paginated<MedicalLogListItem>>(
    `/logs/${toQuery({
      search: filters.search,
      species: filters.species,
      result_status: filters.result_status,
      days: filters.days,
      page: filters.page,
      page_size: filters.page_size,
    })}`,
  )
}

export async function fetchMedicalLog(
  recordId: string,
): Promise<MedicalLogDetail> {
  return cbcClient.get<MedicalLogDetail>(
    `/logs/${encodeURIComponent(recordId)}/`,
  )
}

export async function fetchMedicalLogSummary(
  filters: MedicalLogFilters = {},
): Promise<MedicalLogSummary> {
  return cbcClient.get<MedicalLogSummary>(
    `/logs/summary/${toQuery({
      search: filters.search,
      species: filters.species,
      result_status: filters.result_status,
      days: filters.days,
    })}`,
  )
}

export type SaveMedicalLogPayload = {
  analysis: CbcAnalysis
  petId: number | null
  vetName?: string
}

export async function saveMedicalLog({
  analysis,
  petId,
  vetName = '',
}: SaveMedicalLogPayload): Promise<MedicalLogDetail> {
  const { patient } = analysis
  return cbcClient.post<MedicalLogDetail>('/logs/', {
    pet: petId,
    species: patient.species,
    species_label: patient.species_label,
    pet_name: patient.pet_name,
    owner_name: patient.owner_name,
    breed: patient.breed,
    age_years: patient.age_years,
    sex: patient.sex,
    neuter_status: patient.neuter_status,
    values: analysis.values,
    sample_quality: analysis.sample_quality,
    smear_morphology: analysis.smear_morphology,
    key_findings: analysis.key_findings,
    diagnostic_brief: analysis.diagnostic_brief,
    clinical_notes: analysis.clinical_notes,
    vet_name: vetName,
  })
}

export type MedicalLogAmendment = {
  smear_morphology?: string
  clinical_notes?: string
  vet_name?: string
}

export async function amendMedicalLog(
  recordId: string,
  amendment: MedicalLogAmendment,
): Promise<MedicalLogDetail> {
  return cbcClient.patch<MedicalLogDetail>(
    `/logs/${encodeURIComponent(recordId)}/`,
    amendment,
  )
}

export async function deleteMedicalLog(recordId: string): Promise<void> {
  await cbcClient.delete<void>(`/logs/${encodeURIComponent(recordId)}/`)
}
