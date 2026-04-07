import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useOAuthLogin, useGoogleSignIn } from '@/hooks/useAuth'
import type { OAuthProvider } from '@/types/auth'

interface ProviderConfig {
  id: OAuthProvider
  label: string
  bgClass: string
  textClass: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'github',
    label: 'Continue with GitHub',
    bgClass:
      'bg-slate-900 hover:bg-slate-950 border border-slate-900 hover:border-slate-950',
    textClass: 'text-white',
  },
]

const GoogleMark = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 48 48"
    className="h-4 w-4"
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.014 24.014 0 0 0 0 21.56l7.98-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
)

const GitHubMark = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 30 30"
    className="h-4 w-4"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"
    />
  </svg>
)

type LoginViewProps = {
  variant?: 'page' | 'modal'
  showTitle?: boolean
  onPendingChange?: (pending: boolean) => void
  onLoginSuccess?: () => void
}

export default function LoginPage({
  variant = 'page',
  showTitle = true,
  onPendingChange,
  onLoginSuccess,
}: LoginViewProps) {
  const {
    mutate: login,
    isPending: isGitHubPending,
    variables,
  } = useOAuthLogin()
  const { mutate: googleSignIn, isPending: isGooglePending } = useGoogleSignIn()
  const navigate = useNavigate()
  const hiddenGoogleRef = useRef<HTMLDivElement>(null)
  const [gisReady, setGisReady] = useState(false)
  const isModal = variant === 'modal'

  const handleGoogleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      googleSignIn(response.credential, {
        onSuccess: () => {
          onLoginSuccess?.()
          navigate({ to: '/classify', replace: true })
        },
      })
    },
    [googleSignIn, navigate, onLoginSuccess],
  )

  useEffect(() => {
    const init = () => {
      const el = hiddenGoogleRef.current
      if (!el || !window.google?.accounts?.id) return

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
        callback: handleGoogleCredential,
      })

      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        size: 'large',
        width: 1,
      })

      setGisReady(true)
    }

    if (window.google?.accounts?.id) {
      init()
    } else {
      const id = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(id)
          init()
        }
      }, 100)
      return () => clearInterval(id)
    }
  }, [handleGoogleCredential])

  const handleGoogleClick = () => {
    const btn =
      hiddenGoogleRef.current?.querySelector<HTMLElement>('div[role="button"]')
    btn?.click()
  }

  const isPending = isGitHubPending || isGooglePending

  useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  if (isGooglePending) {
    return (
      <main
        className={`flex flex-col items-center justify-center gap-4 ${
          isModal ? 'w-full py-4' : 'min-h-screen'
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Signing you in…</p>
      </main>
    )
  }

  return (
    <main
      className={`flex flex-col items-center justify-center gap-4 ${
        isModal ? 'w-full py-2' : 'min-h-screen'
      }`}
    >
      {showTitle && (
        <h1 className={isModal ? 'text-xl font-bold' : 'text-2xl font-bold'}>
          Sign in to PawMed
        </h1>
      )}

      <div className={`flex flex-col gap-2.5 ${isModal ? 'w-full' : ''}`}>
        {/* Hidden GIS button for programmatic click */}
        <div
          ref={hiddenGoogleRef}
          className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
          aria-hidden="true"
        />

        {/* Google button — triggers GIS popup */}
        <button
          onClick={handleGoogleClick}
          disabled={isPending || !gisReady}
          aria-busy={isGooglePending}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 disabled:opacity-60"
        >
          <span className="flex h-6 w-6 items-center justify-center">
            <GoogleMark />
          </span>
          <span>
            {isGooglePending ? 'Signing in…' : 'Continue with Google'}
          </span>
        </button>

        {/* GitHub button — redirect flow */}
        {PROVIDERS.map(({ id, label, bgClass, textClass }) => (
          <button
            key={id}
            onClick={() => login(id)}
            disabled={isPending}
            aria-busy={isPending && variables === id}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold shadow-sm transition ${bgClass} ${textClass} disabled:opacity-60`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white">
              <GitHubMark />
            </span>
            <span>
              {isPending && variables === id ? 'Redirecting…' : label}
            </span>
          </button>
        ))}
      </div>
    </main>
  )
}
