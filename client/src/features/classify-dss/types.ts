export type DiseaseClassificationResult = {
  disease_name: string
  short_description: string
  clinical_diagnosis: string
  possible_causes: string[]
  symptoms: string[]
  recommended_treatment: string
  confidence?: number
  additional_notes?: string
  differential_diagnoses?:
    | string[]
    | {
        name: string
        reason_excluded: string
      }[]
  pathophysiology?: string
  visual_cues?: string[]
  study_topics?: string[]
  treatment_protocol?: {
    medications: string[]
    dosage_notes: string
    duration: string
  }
  escalation_criteria?: string[]
}
