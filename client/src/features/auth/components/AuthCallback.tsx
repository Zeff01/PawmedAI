import { useOAuthCallback } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { mutate: syncWithDjango } = useOAuthCallback()
  const calledRef = useRef(false)

  // Debug UI to help diagnose issues with the OAuth callback flow.
  // To enable, add `?debug` to the callback URL. (http://localhost:3000/auth/callback?debug=1)
  /** 
  const showDebug = new URLSearchParams(window.location.search).has('debug')
  if (showDebug) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <div className="relative flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl px-6 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
          <p className="text-sm font-semibold text-white">Signing you in…</p>
          <p className="text-xs text-white">Please keep this window open.</p>
        </div>
      </div>
    )
  }
  **/

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const handleCallback = async (): Promise<void> => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        navigate({
          to: '/classify',
          search: { error: 'oauth_failed' },
          replace: true,
        })
        return
      }

      syncWithDjango(
        { access_token: data.session.access_token },
        {
          onSuccess: () => navigate({ to: '/classify', replace: true }),
          onError: () =>
            navigate({
              to: '/classify',
              search: { error: 'sync_failed' },
              replace: true,
            }),
        },
      )
    }

    handleCallback()
  }, [navigate, syncWithDjango])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl px-6 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
        <p className="text-sm font-semibold text-white">Signing you in…</p>
        <p className="text-xs text-white">Please keep this window open.</p>
      </div>
    </div>
  )
}
