import HomeView from '#/features/home/HomeView'
import { createFileRoute } from '@tanstack/react-router'
import { Seo } from '#/components/Seo'
import { buildSoftwareApplicationSchema } from '#/utils/seo-schema'

export const Route = createFileRoute('/home/')({
  component: RouteComponent,
})

function RouteComponent() {
  const description =
    'AI-assisted veterinary diagnostics for faster, clearer clinical decisions.'

  return (
    <section>
      <Seo
        title="Pawmed AI | Veterinary Diagnostics"
        description={description}
        canonicalPath="/"
        noIndex
        structuredData={buildSoftwareApplicationSchema({
          pageUrl: '/',
          description,
        })}
      />
      <HomeView />
    </section>
  )
}
