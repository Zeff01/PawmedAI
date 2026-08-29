import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchQuota } from '@/lib/quotas'
import type { Quota } from '@/lib/quotas'

export const QUOTA_KEY = ['ai-quota'] as const

/**
 * Remaining analyses — one allowance across every feature that calls a model.
 *
 * The count lives in the server's throttle cache, so this is only ever a read
 * of that; a client-side tally would drift across tabs, devices, and the three
 * features that spend from it.
 */
export function useQuota() {
  return useQuery<Quota>({
    queryKey: QUOTA_KEY,
    queryFn: fetchQuota,
    // The window is hours long; a minute of staleness costs nothing and keeps
    // tab-switching from re-hitting the endpoint.
    staleTime: 60_000,
    retry: 1,
  })
}

/** Refetch after an analysis is spent — or refused for being over the limit. */
export function useRefreshQuota() {
  const queryClient = useQueryClient()
  return React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: QUOTA_KEY }),
    [queryClient],
  )
}
