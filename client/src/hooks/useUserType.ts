import * as React from 'react'

import { useMe } from './useAuth'
import {
  forgetUserType,
  getRememberedUserType,
  rememberUserType,
  subscribeUserType,
} from '@/lib/userTypeCache'
import type { UserType } from '@/types/auth'

/**
 * The current user type, available on the very first render.
 *
 * Falls back to the remembered value from the last visit while `useMe()` is in
 * flight, so the layout does not flip from the anonymous shell to the
 * professional one mid-load. The live answer wins the moment it arrives.
 */
export function useUserType(): {
  userType: UserType | null
  isProfessional: boolean
  isFurParent: boolean
} {
  const { data: me, isError } = useMe()
  const remembered = React.useSyncExternalStore(
    subscribeUserType,
    getRememberedUserType,
    getRememberedUserType,
  )

  React.useEffect(() => {
    if (me) rememberUserType(me.user_type)
    else if (isError) forgetUserType()
  }, [me, isError])

  // `me` is the truth once it lands; an error means there is no session to
  // remember. Until either happens, last visit's answer is the best guess.
  const userType = me ? me.user_type : isError ? null : remembered

  return {
    userType,
    isProfessional: userType === 'professional',
    isFurParent: userType === 'fur_parent',
  }
}
