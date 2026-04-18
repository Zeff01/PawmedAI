import { createFileRoute } from '@tanstack/react-router'

import AuthCallbackPage from '@/features/auth/components/AuthCallback'
import { Seo } from '@/components/Seo'

export const Route = createFileRoute('/auth/callback')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Seo
        title="Authenticating | Pawmed AI"
        noIndex={true}
        canonicalPath="/auth/callback"
      />
      <AuthCallbackPage />
    </>
  )
}
