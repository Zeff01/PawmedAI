export type FurParentRoute =
  | '/'
  | '/classify'
  | '/classify-breed'
  | '/nearby-vets'

export type CareTone = 'primary' | 'tertiary' | 'secondary' | 'neutral'

export type CareStatus = {
  label: string
  tone: CareTone
}

export type CareTag = {
  label: string
  tone: CareTone
  icon?: 'shield' | 'heart' | 'clock' | 'home' | 'dot'
}

export type FurParentPet = {
  id: string
  name: string
  breed: string
  species: 'dog' | 'cat' | 'other'
  photoUrl: string | null
  ageLabel: string
  weightLabel: string
  weightValue: string
  lastCheckupLabel: string
  tags: Array<CareTag>
  favourite: boolean
}

export type WeightTrend = {
  value: string
  unit: string
  change: string
  rising: boolean
  points: Array<{ label: string; value: number }>
}

export type VitalMetric = {
  label: string
  icon: 'scale' | 'steps'
  value: string
  unit: string
  note: string
}

export type VitalsSnapshot = {
  status: CareStatus
  metrics: Array<VitalMetric>
  gauge: { label: string; readout: string; percent: number } | null
  trend: WeightTrend | null
}

export type VaccinationRecord = {
  name: string
  detail: string
  validity: string
  state: 'active' | 'upcoming' | 'overdue'
}

export type MedicationRecord = {
  id: string
  name: string
  detail: string
  cadence: string
  cadenceTone: CareTone
  note: string
  noteTone: CareTone
  nextDue: string | null
  icon: 'pill' | 'chew'
}

export type AppointmentRecord = {
  id: string
  badge: string
  clinic: string
  vetName: string
  vetRole: string
  vetPhotoUrl: string | null
  title: string
  when: string
  startsAt: string
  address: string
}

export type ScreeningRecord = {
  confidence: string
  title: string
  date: string
  summary: string
  recommendation: string
  totalScans: number
}

export type PassportRecord = {
  label: string
  value: string
  icon: 'chip' | 'verified' | 'document'
  mono?: boolean
}

export type PetWellness = {
  petId: string
  syncedLabel: string
  vitals: VitalsSnapshot
  vaccinations: { status: CareStatus; records: Array<VaccinationRecord> }
  medications: { status: CareStatus; records: Array<MedicationRecord> }
  appointment: AppointmentRecord | null
  screening: ScreeningRecord | null
  passport: { status: CareStatus; records: Array<PassportRecord> }
}

export type CareEvent = {
  id: string
  title: string
  detail: string
  timeLabel: string
  tone: CareTone
  icon:
    | 'flask'
    | 'verified'
    | 'scale'
    | 'camera'
    | 'syringe'
    | 'calendar'
    | 'file'
    | 'paw'
}

export type CompanionPrompt = {
  label: string
  icon: 'camera' | 'symptom' | 'breed' | 'vet'
  to: FurParentRoute | null
}

export type LastCompanionQuery = {
  question: string
  answer: string
  askedLabel: string
}

export type FurParentDashboardData = {
  pets: Array<FurParentPet>
  wellness: Record<string, PetWellness>
  timeline: Array<CareEvent>
}

export type PetDraft = {
  name: string
  species: FurParentPet['species']
  breed?: string
  photoUrl?: string
  birthDate?: string | null
  sex?: 'male' | 'female' | 'unknown'
  neuterStatus?: 'intact' | 'neutered' | 'spayed' | 'unknown'
  idealWeightKg?: string | null
  microchipNumber?: string
  insuranceProvider?: string
  indoorOnly?: boolean
}

export type DocumentKind = 'lab' | 'insurance' | 'certificate' | 'other'

export type MedicationCadence =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'as_needed'

export type MedicationForm = 'pill' | 'chew' | 'topical' | 'liquid'

export type MedicationDraft = {
  name: string
  detail?: string
  form: MedicationForm
  cadence: MedicationCadence
  nextDueOn?: string | null
}
