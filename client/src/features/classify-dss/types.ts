export type DiseaseClassificationResult = {
  disease_name: string
  short_description: string
  clinical_diagnosis: string
  possible_causes: string[]
  symptoms: string[]
  recommended_treatment: string
  confidence?: number
  additional_notes?: string
}
