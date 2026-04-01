import { useOAuthLogin } from '@/hooks/useAuth'
import type { OAuthProvider } from '@/types/auth'

interface ProviderConfig {
  id: OAuthProvider
  label: string
  bgClass: string
  textClass: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    bgClass: 'bg-white border border-gray-200',
    textClass: 'text-gray-700',
  },
  {
    id: 'github',
    label: 'Continue with GitHub',
    bgClass: 'bg-gray-900',
    textClass: 'text-white',
  },
]

type LoginViewProps = {
  variant?: 'page' | 'modal'
}

export default function LoginPage({ variant = 'page' }: LoginViewProps) {
  const { mutate: login, isPending, variables } = useOAuthLogin()
  const isModal = variant === 'modal'

  return (
    <main
      className={`flex flex-col items-center justify-center gap-4 ${
        isModal ? 'py-2' : 'min-h-screen'
      }`}
    >
      <h1 className={isModal ? 'text-xl font-bold' : 'text-2xl font-bold'}>
        Sign in to PawMed
      </h1>

      {PROVIDERS.map(({ id, label, bgClass, textClass }) => (
        <button
          key={id}
          onClick={() => login(id)}
          disabled={isPending}
          aria-busy={isPending && variables === id}
          className={`w-64 px-6 py-3 rounded-lg shadow transition font-medium ${bgClass} ${textClass} disabled:opacity-60`}
        >
          {isPending && variables === id ? 'Redirecting…' : label}
        </button>
      ))}
    </main>
  )
}
