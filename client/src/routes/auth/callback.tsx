import { createFileRoute } from '@tanstack/react-router'

import AuthCallbackPage from '@/features/auth/components/AuthCallback'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})
