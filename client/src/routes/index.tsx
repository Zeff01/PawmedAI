import { createFileRoute } from '@tanstack/react-router'

import HomeView from '#/features/home/HomeView'
import { Seo } from '#/components/Seo'
import { buildSoftwareApplicationSchema } from '#/utils/seo-schema'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  const description =
    'AI-assisted veterinary diagnostics for faster, clearer clinical decisions.'

  return (
    <>
      <Seo
        title="Pawmed AI | Veterinary Diagnostics"
        description={description}
        canonicalPath="/"
        structuredData={buildSoftwareApplicationSchema({
          pageUrl: '/',
          description,
        })}
      />
      <HomeView />
    </>
  )
}
