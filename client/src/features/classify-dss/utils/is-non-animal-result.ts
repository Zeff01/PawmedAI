import type { DiseaseClassificationResult } from '../types'
import { isFurParentResult } from '../types'

function isNonAnimalResult(result: DiseaseClassificationResult) {
  const text = isFurParentResult(result)
    ? `${result.possible_condition_name} ${result.what_we_noticed} ${result.what_this_might_mean}`
        .toLowerCase()
        .trim()
    : `${result.disease_name} ${result.short_description} ${result.clinical_diagnosis} ${result.additional_notes ?? ''}`
        .toLowerCase()
        .trim()
  return (
    text.includes('no animal') ||
    text.includes('not an animal') ||
    text.includes('no animal present') ||
    text.includes('not applicable') ||
    text.includes('poster') ||
    text.includes('illustration')
  )
}

export { isNonAnimalResult }
