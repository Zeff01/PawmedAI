import type { DiseaseClassificationResult } from '../types'

function isNonAnimalResult(result: DiseaseClassificationResult) {
  const text =
    `${result.disease_name} ${result.short_description} ${result.clinical_diagnosis} ${result.additional_notes ?? ''}`
      .toLowerCase()
      .trim()
  return (
    text.includes('no animal') ||
    text.includes('not an animal') ||
    text.includes('no animal present') ||
    text.includes('not applicable')
  )
}

export { isNonAnimalResult }
