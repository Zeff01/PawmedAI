import { useGoogleSignIn } from '@/hooks/useAuth'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { mutate: googleSignIn } = useGoogleSignIn()
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      navigate({
        to: '/classify',
        search: { error: 'oauth_failed' },
        replace: true,
      })
      return
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`

    googleSignIn(
      { code, redirectUri },
      {
        onSuccess: () => navigate({ to: '/classify', replace: true }),
        onError: () =>
          navigate({
            to: '/classify',
            search: { error: 'oauth_failed' },
            replace: true,
          }),
      },
    )
  }, [navigate, googleSignIn])

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
