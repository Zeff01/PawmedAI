export type Species =
  | 'canine'
  | 'feline'
  | 'equine'
  | 'bovine'
  | 'ovine'
  | 'caprine'
  | 'porcine'
  | 'rabbit'
  | 'ferret'
  | 'guinea_pig'
  | 'rat'
  | 'mouse'
  | 'avian'
  | 'other'

export type SpeciesSource = 'selected' | 'report'
export type Sex = 'male' | 'female' | 'unknown'
export type NeuterStatus = 'intact' | 'neutered' | 'spayed' | 'unknown'
export type SampleQualityFlag = 'hemolyzed' | 'lipemic' | 'clotted'

export type AnalyteStatus = 'low' | 'normal' | 'high' | 'not_assessed'

export type ResultStatus = 'normal' | 'low' | 'high' | 'abnormal'

export type SeriesKey = 'rbc_series' | 'wbc_series' | 'plt_series'

export type PatientContext = {
  pet_name: string
  owner_name: string
  species: Species
  species_label: string
  breed: string
  age_years: number | null
  sex: Sex
  neuter_status: NeuterStatus
}

/** One flagged analyte, exactly as the server returns it. */
export type AnalyteResult = {
  key: string
  label: string
  series: SeriesKey
  unit: string
  value: number
  value_label: string
  reference_low: number | null
  reference_high: number | null
  reference_label: string
  status: AnalyteStatus
}

export type PanelEvaluation = {
  species: Species
  results: Array<AnalyteResult>
  flags: Array<AnalyteResult>
  result_status: ResultStatus
  provided_count: number
  missing_required: Array<string>
}

export type CbcAnalysis = {
  patient: PatientContext & { species_display: string }
  values: Record<string, number>
  results: Array<AnalyteResult>
  flags: Array<AnalyteResult>
  result_status: ResultStatus
  flag_count: number
  missing_required: Array<string>
  sample_quality: Array<SampleQualityFlag>
  smear_morphology: string
  read_from_image: boolean
  extracted_values: Array<string>
  extracted_patient_fields: Array<string>
  species_source: SpeciesSource
  not_assessed: Array<AnalyteResult>
  species_caveat: string
  notice: string
  key_findings: string
  diagnostic_brief: string
  clinical_notes: string
}

export type Pet = {
  id: number
  name: string
  species: Species
  species_label: string
  species_display: string
  breed: string
  age_years: string | null
  sex: Sex
  neuter_status: NeuterStatus
  owner_name: string
  notes: string
  log_count: number
  created_at: string
  updated_at: string
}

/** Fields collected by the "add a new patient" form, before the API call. */
export type PetDraft = {
  name: string
  species: Species
  speciesLabel?: string
  breed?: string
  ageYears?: number | null
  sex?: Sex
  neuterStatus?: NeuterStatus
  ownerName?: string
}

export type MedicalLogListItem = {
  id: number
  record_id: string
  pet_id: number | null
  pet_name: string
  species: Species
  species_display: string
  breed: string
  test_type: string
  test_date: string
  key_findings: string
  result_status: ResultStatus
  flag_count: number
  created_at: string
}

export type MedicalLogDetail = MedicalLogListItem & {
  owner_name: string
  species_label: string
  age_years: string | null
  sex: Sex
  neuter_status: NeuterStatus
  values: Record<string, number>
  evaluation: Partial<PanelEvaluation>
  diagnostic_brief: string
  clinical_notes: string
  sample_quality: Array<SampleQualityFlag>
  smear_morphology: string
  vet_name: string
  updated_at: string
}

export type MedicalLogSummary = {
  total: number
  normal: number
  abnormal: number
  normal_change: number | null
  abnormal_change: number | null
  this_month: number
  window_days: number | null
}

export type MedicalLogFilters = {
  search?: string
  species?: Species | ''
  result_status?: ResultStatus | ''
  days?: number | ''
  page?: number
  page_size?: number
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: Array<T>
}
