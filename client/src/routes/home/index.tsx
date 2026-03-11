import HomeView from '#/features/home/HomeView'
import { createFileRoute } from '@tanstack/react-router'
import { Seo } from '#/components/Seo'

export const Route = createFileRoute('/home/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <section className="px-5 py-8" aria-labelledby="home-title">
      <Seo
        title="Home | Pawmed AI"
        description="Explore Pawmed AI features for veterinary diagnostics."
        canonicalPath="/home"
      />
      <h1 id="home-title" className="text-2xl font-semibold text-slate-900">
        Welcome to Pawmed AI
      </h1>
      <HomeView />
    </section>
  )
}
