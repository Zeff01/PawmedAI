import { AnimalDetailView } from '@/features/animals/AnimalDetailView'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/animals/$slug/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { slug } = Route.useParams()
  return <AnimalDetailView slug={slug} />
}
