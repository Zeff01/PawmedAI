import { useMutation } from '@tanstack/react-query'
import { classifyBreed  } from '../api/classifyBreed'
import type {BreedClassifyPayload} from '../api/classifyBreed';
import type { BreedClassificationResult } from '../types'
import { useRefreshQuota } from '@/hooks/useQuota'

export function useClassifyBreed() {
  const refreshQuota = useRefreshQuota()
  return useMutation<BreedClassificationResult, Error, BreedClassifyPayload>({
    mutationFn: classifyBreed,
    // A run spends from the shared AI allowance whether it succeeds or comes
    // back throttled. Refreshing here rather than at the call site means a new
    // caller cannot forget to.
    onSettled: () => refreshQuota(),
  })
}
