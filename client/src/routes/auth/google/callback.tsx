import { createFileRoute } from '@tanstack/react-router'

import GoogleCallbackPage from '@/features/auth/components/GoogleCallback'
import { Seo } from '@/components/Seo'

export const Route = createFileRoute('/auth/google/callback')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Seo
        title="Authenticating | Pawmed AI"
        noIndex={true}
        canonicalPath="/auth/google/callback"
      />
      <GoogleCallbackPage />
    </>
  )
}
