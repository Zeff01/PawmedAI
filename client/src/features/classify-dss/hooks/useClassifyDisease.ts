import { useMutation } from '@tanstack/react-query'

import { classifyDiseaseImage } from '../api/classifyDisease'
import type { DiseaseClassificationResult } from '../types'
import { useUserTypeStore } from '@/stores/userTypeStore'

export function useClassifyDisease() {
  const userType = useUserTypeStore((state) => state.userType)
  return useMutation<DiseaseClassificationResult, Error, File>({
    mutationFn: (file) => classifyDiseaseImage(file, userType ?? 'student'),
  })
}
