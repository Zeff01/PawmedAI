export type BreedSize = 'small' | 'medium' | 'large' | 'extra-large'

export type BreedClassificationResult = {
  animal_type: string
  breed_name: string
  confidence: number
  description: string
  origin: string
  size: BreedSize
  temperament: string[]
  common_traits: string[]
  care_tips: string[]
  fun_fact: string
  not_identified: boolean
}
