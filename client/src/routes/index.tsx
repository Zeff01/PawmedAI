import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import HomeView from '@/features/home/HomeView'
import { DashboardView } from '@/features/dashboard/DashboardView'
import { Seo } from '@/components/Seo'
import { AuthModal } from '@/components/AuthModal'
import { useUserType } from '@/hooks/useUserType'
import {
  buildSoftwareApplicationSchema,
  buildBreadcrumbSchema,
  buildSiteSchemas,
} from '@/utils/seo-schema'

type HomeSearch = { signin?: 'required' }

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    signin: search.signin === 'required' ? 'required' : undefined,
  }),
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()
  const { signin } = Route.useSearch()
  const [gateOpen, setGateOpen] = useState(signin === 'required')
  const { isProfessional } = useUserType()

  // Veterinary Professionals get their workspace here instead of the marketing
  // page. Crawlers and the prerenderer have no session, so `/` still renders
  // the landing page — and with it the marketing SEO — for them.
  if (isProfessional) {
    return (
      <>
        <Seo
          title="Dashboard | Pawmed AI"
          description="Your Pawmed AI professional workspace: recent CBC analyses, result mix, and patients."
          canonicalPath="/"
          noIndex
        />
        <DashboardView />
      </>
    )
  }

  const closeGate = (next: boolean) => {
    setGateOpen(next)
    if (!next && signin) {
      navigate({ to: '/', search: {}, replace: true })
    }
  }

  const description =
    'Pawmed AI turns clinical pet photos into structured diagnostic briefs in under 5 minutes. AI-powered veterinary diagnostics for vets, students, and pet owners.'

  return (
    <>
      <Seo
        title="Pawmed AI | Veterinary Diagnostics"
        description={description}
        keywords="veterinary diagnostics, AI vet tool, animal disease classification, clinical diagnostic brief, veterinary AI, pet diagnostics, vet decision support, pawmed ai"
        canonicalPath="/"
        ogImage="/images/hero_image.jpg"
        ogImageAlt="Pawmed AI — AI-powered veterinary diagnostics platform"
        structuredData={[
          buildSoftwareApplicationSchema({ pageUrl: '/', description }),
          buildBreadcrumbSchema([{ name: 'Home', path: '/' }]),
          ...buildSiteSchemas(),
        ]}
      />
      <AuthModal
        open={gateOpen}
        onOpenChange={closeGate}
        notice="Classify Disease requires an account. Sign in to continue."
        onAuthenticated={() => navigate({ to: '/classify' })}
      />
      <HomeView />
    </>
  )
}
