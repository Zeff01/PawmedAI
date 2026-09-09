import { cbcClient } from './cbcClient'
import type {
  CbcAnalysis,
  NeuterStatus,
  SampleQualityFlag,
  Sex,
  Species,
} from '../types'

export type AnalyzeCbcPayload = {
  /** Uploadcare CDN URL — the API fetches the bytes from it. */
  reportImageUrl?: string | null
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
    reportImageUrl,
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
  if (!reportImageUrl && !hasValues) {
    throw new Error('Upload a CBC report or enter at least one blood value.')
  }

  // The report is already on the CDN, so the image and values-only requests are
  // the same JSON body — the multipart branch this used to need is gone.
  return cbcClient.post<CbcAnalysis>('/analyze/', {
    ...(reportImageUrl ? { image_url: reportImageUrl } : {}),
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
