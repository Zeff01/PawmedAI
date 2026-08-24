import type {
  NeuterStatus,
  SampleQualityFlag,
  SeriesKey,
  Sex,
  Species,
} from './types'

export type AnalyteField = {
  key: string
  label: string
  unit: string
  optional?: boolean
  pairedWith?: string
  fullWidth?: boolean
}

export type SeriesGroup = {
  key: SeriesKey
  label: string
  shortLabel: string
  fields: Array<AnalyteField>
}

export const SERIES_GROUPS: Array<SeriesGroup> = [
  {
    key: 'rbc_series',
    label: 'Red Blood Cell (Erythrocyte) Series',
    shortLabel: 'Red blood cell series',
    fields: [
      { key: 'rbc', label: 'RBC', unit: '10^12/L' },
      { key: 'hgb', label: 'HGB', unit: 'g/dL' },
      { key: 'hct', label: 'HCT / PCV', unit: '%' },
      { key: 'mcv', label: 'MCV', unit: 'fL' },
      { key: 'mch', label: 'MCH', unit: 'pg' },
      { key: 'mchc', label: 'MCHC', unit: 'g/dL' },
      { key: 'rdw', label: 'RDW', unit: '%' },
      {
        key: 'retic_abs',
        label: 'Reticulocytes (abs)',
        unit: '/uL',
        optional: true,
      },
      {
        key: 'retic_pct',
        label: 'Reticulocytes',
        unit: '%',
        optional: true,
        pairedWith: 'retic_abs',
      },
    ],
  },
  {
    key: 'wbc_series',
    label: 'White Blood Cell (Leukocyte) Series',
    shortLabel: 'White blood cell series',
    fields: [
      { key: 'wbc', label: 'WBC (total)', unit: '10^9/L', fullWidth: true },
      { key: 'neut_seg_abs', label: 'Neutrophils — segmented', unit: '10^9/L' },
      {
        key: 'neut_seg_pct',
        label: 'Neutrophils — segmented',
        unit: '%',
        pairedWith: 'neut_seg_abs',
      },
      { key: 'neut_band_abs', label: 'Neutrophils — band', unit: '10^9/L' },
      {
        key: 'neut_band_pct',
        label: 'Neutrophils — band',
        unit: '%',
        pairedWith: 'neut_band_abs',
      },
      { key: 'lymph_abs', label: 'Lymphocytes', unit: '10^9/L' },
      {
        key: 'lymph_pct',
        label: 'Lymphocytes',
        unit: '%',
        pairedWith: 'lymph_abs',
      },
      { key: 'mono_abs', label: 'Monocytes', unit: '10^9/L' },
      {
        key: 'mono_pct',
        label: 'Monocytes',
        unit: '%',
        pairedWith: 'mono_abs',
      },
      { key: 'eos_abs', label: 'Eosinophils', unit: '10^9/L' },
      {
        key: 'eos_pct',
        label: 'Eosinophils',
        unit: '%',
        pairedWith: 'eos_abs',
      },
      { key: 'baso_abs', label: 'Basophils', unit: '10^9/L' },
      {
        key: 'baso_pct',
        label: 'Basophils',
        unit: '%',
        pairedWith: 'baso_abs',
      },
    ],
  },
  {
    key: 'plt_series',
    label: 'Platelet (Thrombocyte) Series',
    shortLabel: 'Platelet series',
    fields: [
      { key: 'plt', label: 'PLT', unit: '10^9/L' },
      { key: 'mpv', label: 'MPV', unit: 'fL' },
    ],
  },
]

export const SPECIES_GROUPS: Array<{
  label: string
  options: Array<{ value: Species; label: string }>
}> = [
  {
    label: 'Companion',
    options: [
      { value: 'canine', label: 'Canine (dog)' },
      { value: 'feline', label: 'Feline (cat)' },
      { value: 'rabbit', label: 'Rabbit' },
      { value: 'ferret', label: 'Ferret' },
      { value: 'avian', label: 'Avian (psittacine)' },
    ],
  },
  {
    label: 'Small mammal',
    options: [
      { value: 'guinea_pig', label: 'Guinea pig' },
      { value: 'rat', label: 'Rat' },
      { value: 'mouse', label: 'Mouse' },
    ],
  },
  {
    label: 'Large animal',
    options: [
      { value: 'equine', label: 'Equine (horse)' },
      { value: 'bovine', label: 'Bovine (cattle)' },
      { value: 'ovine', label: 'Ovine (sheep)' },
      { value: 'caprine', label: 'Caprine (goat)' },
      { value: 'porcine', label: 'Porcine (pig)' },
    ],
  },
  {
    label: 'Not listed',
    options: [{ value: 'other', label: 'Other species' }],
  },
]

export const SPECIES_OPTIONS: Array<{ value: Species; label: string }> =
  SPECIES_GROUPS.flatMap((group) => group.options)

export function speciesLabel(value: Species): string {
  return (
    SPECIES_OPTIONS.find((option) => option.value === value)?.label ?? value
  )
}

export const SEX_OPTIONS: Array<{ value: Sex; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unknown', label: 'Unknown' },
]

export const NEUTER_OPTIONS: Array<{ value: NeuterStatus; label: string }> = [
  { value: 'intact', label: 'Intact' },
  { value: 'neutered', label: 'Neutered' },
  { value: 'spayed', label: 'Spayed' },
  { value: 'unknown', label: 'Unknown' },
]

export const SAMPLE_QUALITY_OPTIONS: Array<{
  value: SampleQualityFlag
  label: string
  hint: string
}> = [
  {
    value: 'hemolyzed',
    label: 'Hemolyzed',
    hint: 'Can falsely raise HGB and MCHC',
  },
  {
    value: 'lipemic',
    label: 'Lipemic',
    hint: 'Can interfere with HGB and indices',
  },
  {
    value: 'clotted',
    label: 'Clotted',
    hint: 'Can falsely lower PLT and WBC',
  },
]

export const STATUS_STYLES = {
  normal: {
    label: 'Normal',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  low: {
    label: 'Low',
    pill: 'bg-red-50 text-red-700 ring-red-200',
  },
  high: {
    label: 'High',
    pill: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  abnormal: {
    label: 'Abnormal',
    pill: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  not_assessed: {
    label: 'Not assessed',
    pill: 'bg-slate-100 text-slate-500 ring-slate-200',
  },
} as const

export const MAX_REPORT_MB = 8
export const ACCEPTED_REPORT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
