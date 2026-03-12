import HomeView from '#/features/home/HomeView'
import { createFileRoute } from '@tanstack/react-router'
import { Seo } from '#/components/Seo'

export const Route = createFileRoute('/home/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <section>
      <Seo
        title="Pawmed AI | Veterinary Diagnostics"
        description="AI-assisted veterinary diagnostics for faster, clearer clinical decisions."
        canonicalPath="/"
        noIndex
      />
      <HomeView />
    </section>
  )
}
