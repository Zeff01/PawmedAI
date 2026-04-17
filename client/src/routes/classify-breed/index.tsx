import ClassifyBreedView from '@/features/classify-breed/ClassifyBreedView'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/classify-breed/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <ClassifyBreedView />
    </div>
  )
}
