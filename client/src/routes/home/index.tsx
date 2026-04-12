import HomeView from '@/features/home/HomeView'
import { createFileRoute } from '@tanstack/react-router'
import { Seo } from '@/components/Seo'
import { buildSoftwareApplicationSchema } from '@/utils/seo-schema'

export const Route = createFileRoute('/home/')({
  component: RouteComponent,
})

function RouteComponent() {
  const description =
    'Pawmed AI turns clinical pet photos into structured diagnostic briefs in under 5 minutes. AI-powered veterinary diagnostics for vets, students, and pet owners.'

  return (
    <section>
      <Seo
        title="Pawmed AI | Veterinary Diagnostics"
        description={description}
        keywords="veterinary diagnostics, AI vet tool, animal disease classification, clinical diagnostic brief, veterinary AI, pet diagnostics, vet decision support, pawmed ai"
        canonicalPath="/"
        structuredData={buildSoftwareApplicationSchema({
          pageUrl: '/',
          description,
        })}
      />
      <HomeView />
    </section>
  )
}
