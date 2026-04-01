import { useOAuthCallback } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { mutate: syncWithDjango } = useOAuthCallback()
  const calledRef = useRef(false)

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
    <main className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 animate-pulse">Signing you in…</p>
    </main>
  )
}
