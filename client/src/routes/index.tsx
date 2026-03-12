import { createFileRoute } from '@tanstack/react-router'

import HomeView from '#/features/home/HomeView'
import { Seo } from '#/components/Seo'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <>
      <Seo
        title="Pawmed AI | Veterinary Diagnostics"
        description="AI-assisted veterinary diagnostics for faster, clearer clinical decisions."
        canonicalPath="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Pawmed AI',
          applicationCategory: 'MedicalApplication',
          operatingSystem: 'Web',
          description:
            'AI-assisted veterinary diagnostics for faster, clearer clinical decisions.',
        }}
      />
      <HomeView />
    </>
  )
}
