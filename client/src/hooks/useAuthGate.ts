import * as React from 'react'

import { useSupabaseSession } from './useAuth'

/**
 * Hold a generation behind sign-in.
 *
 * Every run spends from an allowance, and an allowance belongs to an account,
 * so a signed-out visitor cannot generate at all. The server enforces that with
 * a 401; this is the same rule stated early, so the click opens a sign-in
 * dialog instead of travelling to the API to be refused.
 *
 * Sign-in leaves the page (OAuth redirects), so the queued action is a
 * best-effort resume for providers that return in place — the visitor coming
 * back to a form they can now submit is the normal path.
 */
export function useAuthGate() {
  const { session, isLoading } = useSupabaseSession()
  const [isAuthPromptOpen, setAuthPromptOpen] = React.useState(false)
  const pendingRef = React.useRef<(() => void) | null>(null)

  const isAuthenticated = Boolean(session)

  /**
   * Run `action` when there is a session; otherwise open the sign-in dialog.
   * Returns whether the action ran, for callers that need to bail out early.
   */
  const runWhenSignedIn = React.useCallback(
    (action: () => void) => {
      // Mid-check, the honest answer is "not yet" — firing now would send an
      // unauthenticated request from someone who is in fact signed in.
      if (isLoading) return false
      if (session) {
        action()
        return true
      }
      pendingRef.current = action
      setAuthPromptOpen(true)
      return false
    },
    [isLoading, session],
  )

  const handleAuthenticated = React.useCallback(() => {
    setAuthPromptOpen(false)
    const queued = pendingRef.current
    pendingRef.current = null
    queued?.()
  }, [])

  const closeAuthPrompt = React.useCallback((open: boolean) => {
    if (!open) pendingRef.current = null
    setAuthPromptOpen(open)
  }, [])

  return {
    isAuthenticated,
    isSessionLoading: isLoading,
    runWhenSignedIn,
    isAuthPromptOpen,
    setAuthPromptOpen: closeAuthPrompt,
    handleAuthenticated,
  }
}
