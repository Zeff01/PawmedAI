import { z } from 'zod'
import type { CbcAnalysis, NeuterStatus, Sex, Species } from './types'

export const SPECIES_VALUES = [
  'canine',
  'feline',
  'equine',
  'bovine',
  'ovine',
  'caprine',
  'porcine',
  'rabbit',
  'ferret',
  'guinea_pig',
  'rat',
  'mouse',
  'avian',
  'other',
] as const
export const SEX_VALUES = ['male', 'female', 'unknown'] as const
export const NEUTER_VALUES = [
  'intact',
  'neutered',
  'spayed',
  'unknown',
] as const

const _speciesCheck = SPECIES_VALUES satisfies ReadonlyArray<Species>
const _sexCheck = SEX_VALUES satisfies ReadonlyArray<Sex>
const _neuterCheck = NEUTER_VALUES satisfies ReadonlyArray<NeuterStatus>
void _speciesCheck
void _sexCheck
void _neuterCheck

const MAX_AGE_YEARS = 100

export const patientSchema = z
  .object({
    species: z.enum(SPECIES_VALUES, {
      errorMap: () => ({ message: 'Choose the species.' }),
    }),
    speciesLabel: z
      .string()
      .max(60, 'Keep the species name under 60 characters.'),
    petName: z
      .string()
      .trim()
      .min(1, "Enter the patient's name.")
      .max(120, 'Keep the name under 120 characters.'),
    ownerName: z
      .string()
      .trim()
      .min(1, "Enter the owner's name.")
      .max(120, 'Keep the name under 120 characters.'),
    breed: z
      .string()
      .trim()
      .min(1, 'Enter the breed, or “Mixed”.')
      .max(120, 'Keep the breed under 120 characters.'),
    ageYears: z
      .string()
      .trim()
      .min(1, 'Enter the age in years.')
      .refine((value) => Number.isFinite(Number(value)), {
        message: 'Enter the age as a number.',
      })
      .refine((value) => Number(value) >= 0 && Number(value) <= MAX_AGE_YEARS, {
        message: `Enter an age between 0 and ${MAX_AGE_YEARS}.`,
      }),
    sex: z.enum(SEX_VALUES, {
      errorMap: () => ({ message: 'Select the sex.' }),
    }),
    neuterStatus: z.enum(NEUTER_VALUES, {
      errorMap: () => ({ message: 'Select the neuter status.' }),
    }),
  })
  .superRefine((values, ctx) => {
    if (values.species === 'other' && values.speciesLabel.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['speciesLabel'],
        message: 'Name the species.',
      })
    }
  })

export type PatientFormValues = z.infer<typeof patientSchema>

export const newPetSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Give the patient a name.')
      .max(120, 'Keep the name under 120 characters.'),
    species: z.enum(SPECIES_VALUES, {
      errorMap: () => ({ message: 'Choose the species.' }),
    }),
    speciesLabel: z.string().max(60, 'Keep it under 60 characters.'),
    ownerName: z.string().max(120, 'Keep it under 120 characters.'),
    breed: z.string().max(120, 'Keep it under 120 characters.'),
    ageYears: z
      .string()
      .refine(
        (value) =>
          value.trim() === '' ||
          (Number.isFinite(Number(value)) &&
            Number(value) >= 0 &&
            Number(value) <= MAX_AGE_YEARS),
        {
          message: `Enter an age between 0 and ${MAX_AGE_YEARS}, or leave it blank.`,
        },
      ),
    sex: z.enum(SEX_VALUES),
    neuterStatus: z.enum(NEUTER_VALUES),
  })
  .superRefine((values, ctx) => {
    if (values.species === 'other' && values.speciesLabel.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['speciesLabel'],
        message: 'Name the species.',
      })
    }
  })

export type NewPetFormValues = z.infer<typeof newPetSchema>

export const EMPTY_PATIENT_FORM = {
  species: undefined,
  speciesLabel: '',
  petName: '',
  ownerName: '',
  breed: '',
  ageYears: '',
  sex: undefined,
  neuterStatus: undefined,
} satisfies Record<keyof PatientFormValues, unknown>

export function formValuesFromAnalysis(
  analysis: CbcAnalysis,
): PatientFormValues {
  const { patient } = analysis
  return {
    species: patient.species,
    speciesLabel: patient.species_label,
    petName: patient.pet_name,
    ownerName: patient.owner_name,
    breed: patient.breed,
    ageYears: patient.age_years !== null ? String(patient.age_years) : '',
    sex: patient.sex,
    neuterStatus: patient.neuter_status,
  }
}

const FIELD_MAP: Record<string, keyof PatientFormValues> = {
  pet_name: 'petName',
  owner_name: 'ownerName',
  breed: 'breed',
  age_years: 'ageYears',
  sex: 'sex',
  neuter_status: 'neuterStatus',
  species_label: 'speciesLabel',
}

export function prefilledFields(
  analysis: CbcAnalysis,
): Array<keyof PatientFormValues> {
  return analysis.extracted_patient_fields
    .map((field) => FIELD_MAP[field])
    .filter((name): name is keyof PatientFormValues => Boolean(name))
}
