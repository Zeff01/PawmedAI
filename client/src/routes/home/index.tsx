import HomeView from '#/features/home/HomeView'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/home/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <HomeView />
    </div>
  )
}
