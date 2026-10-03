import { useEffect } from 'react'

import { linkPushSubscriptionToAccount } from './push'
import { useSupabaseSession } from '@/hooks/useAuth'

/** Whenever someone signs in, link this device's notifications to them. */
export function usePushAccountLink() {
  const { session } = useSupabaseSession()
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    linkPushSubscriptionToAccount().catch(() => {
      // Not worth bothering the user about; the next sign-in tries again.
    })
  }, [userId])
}
