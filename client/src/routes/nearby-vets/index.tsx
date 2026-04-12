import { createFileRoute } from '@tanstack/react-router'
import NearbyVetsGeoMap from '@/components/custom/NearbyVetsGeoMap'
import { Seo } from '@/components/Seo'

export const Route = createFileRoute('/nearby-vets/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <section>
      <Seo
        title="Pawmed AI | Find a Vet"
        description="Find nearby veterinary clinics on the map."
        canonicalPath="/nearby-vets"
      />
      <div className="py-10 px-52">
        <NearbyVetsGeoMap />
      </div>
    </section>
  )
}
