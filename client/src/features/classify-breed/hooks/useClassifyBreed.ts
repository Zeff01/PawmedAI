import { useMutation } from '@tanstack/react-query'
import { classifyBreed, type BreedClassifyPayload } from '../api/classifyBreed'
import type { BreedClassificationResult } from '../types'

export function useClassifyBreed() {
  return useMutation<BreedClassificationResult, Error, BreedClassifyPayload>({
    mutationFn: classifyBreed,
  })
}
