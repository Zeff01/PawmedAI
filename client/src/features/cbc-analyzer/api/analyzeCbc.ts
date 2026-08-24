import { cbcClient } from './cbcClient'
import type {
  CbcAnalysis,
  NeuterStatus,
  SampleQualityFlag,
  Sex,
  Species,
} from '../types'

export type AnalyzeCbcPayload = {
  reportImage?: File | null
  values: Record<string, number>
  species?: Species | ''
  speciesLabel?: string
  petName?: string
  ownerName?: string
  breed?: string
  ageYears?: number | null
  sex?: Sex
  neuterStatus?: NeuterStatus
  sampleQuality?: Array<SampleQualityFlag>
  smearMorphology?: string
}

export async function analyzeCbc(
  payload: AnalyzeCbcPayload,
): Promise<CbcAnalysis> {
  const {
    reportImage,
    values,
    species = '',
    speciesLabel = '',
    petName = '',
    ownerName = '',
    breed = '',
    ageYears = null,
    sex = 'unknown',
    neuterStatus = 'unknown',
    sampleQuality = [],
    smearMorphology = '',
  } = payload

  const hasValues = Object.keys(values).length > 0
  if (!reportImage && !hasValues) {
    throw new Error('Upload a CBC report or enter at least one blood value.')
  }

  if (reportImage) {
    const form = new FormData()
    form.append('image', reportImage)
    form.append('values', JSON.stringify(values))
    if (species) {
      form.append('species', species)
      form.append('species_label', speciesLabel)
    }
    form.append('pet_name', petName)
    form.append('owner_name', ownerName)
    form.append('breed', breed)
    if (ageYears !== null) {
      form.append('age_years', String(ageYears))
    }
    form.append('sex', sex)
    form.append('neuter_status', neuterStatus)
    form.append('sample_quality', JSON.stringify(sampleQuality))
    form.append('smear_morphology', smearMorphology)
    return cbcClient.post<CbcAnalysis>('/analyze/', form)
  }

  return cbcClient.post<CbcAnalysis>('/analyze/', {
    values,
    ...(species ? { species, species_label: speciesLabel } : {}),
    pet_name: petName,
    owner_name: ownerName,
    breed,
    age_years: ageYears,
    sex,
    neuter_status: neuterStatus,
    sample_quality: sampleQuality,
    smear_morphology: smearMorphology,
  })
}
