import { useMutation } from '@tanstack/react-query'

import { classifyDisease, type DiseaseClassifyPayload } from '../api/classifyDisease'
import type { DiseaseClassificationResult } from '../types'
import { useUserTypeStore } from '@/stores/userTypeStore'

export function useClassifyDisease() {
  const userType = useUserTypeStore((state) => state.userType)
  return useMutation<DiseaseClassificationResult, Error, Omit<DiseaseClassifyPayload, 'mode'>>({
    mutationFn: (payload) =>
      classifyDisease({ ...payload, mode: userType ?? 'student' }),
  })
}
