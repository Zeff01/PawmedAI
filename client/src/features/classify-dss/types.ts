export type ClinicalClassificationResult = {
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

export type FurParentClassificationResult = {
  possible_condition_name: string
  what_we_noticed: string
  what_this_might_mean: string
  signs_to_watch_for: string[]
  how_serious_does_it_look: string
  what_you_can_do_right_now: string[]
  see_a_vet_because: string
  urgency:
    | 'routine checkup'
    | 'schedule soon (within a few days)'
    | 'go today'
    | 'emergency — go now'
  reassurance_note: string
}

export type DiseaseClassificationResult =
  | ClinicalClassificationResult
  | FurParentClassificationResult

export function isFurParentResult(
  result: DiseaseClassificationResult,
): result is FurParentClassificationResult {
  return 'what_we_noticed' in result
}
