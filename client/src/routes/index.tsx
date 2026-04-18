import { createFileRoute } from '@tanstack/react-router'

import HomeView from '@/features/home/HomeView'
import { Seo } from '@/components/Seo'
import {
  buildSoftwareApplicationSchema,
  buildBreadcrumbSchema,
  buildSiteSchemas,
} from '@/utils/seo-schema'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
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
      <HomeView />
    </>
  )
}
