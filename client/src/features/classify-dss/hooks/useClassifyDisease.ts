import { useMutation } from '@tanstack/react-query'

import { classifyDisease  } from '../api/classifyDisease'
import type {DiseaseClassifyPayload} from '../api/classifyDisease';
import type { DiseaseClassificationResult } from '../types'
import { useRefreshQuota } from '@/hooks/useQuota'
import { useUserTypeStore } from '@/stores/userTypeStore'

export function useClassifyDisease() {
  const userType = useUserTypeStore((state) => state.userType)
  const refreshQuota = useRefreshQuota()
  return useMutation<DiseaseClassificationResult, Error, Omit<DiseaseClassifyPayload, 'mode'>>({
    mutationFn: (payload) =>
      classifyDisease({ ...payload, mode: userType ?? 'student' }),
    // A run spends from the shared AI allowance whether it succeeds or comes
    // back throttled. Refreshing here rather than at the call site means a new
    // caller cannot forget to.
    onSettled: () => refreshQuota(),
  })
}
