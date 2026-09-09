import { createFileRoute } from '@tanstack/react-router'

import { CaseWorkspaceView } from '@/features/student/CaseWorkspaceView'
import { Seo } from '@/components/Seo'

export const Route = createFileRoute('/academy/$slug')({
  component: CaseRoute,
})

function CaseRoute() {
  const { slug } = Route.useParams()

  return (
    <>
      {/* Coursework behind a student login — nothing here belongs in an index. */}
      <Seo
        title="Case | Pawmed AI"
        description="Work a simulated veterinary case stage by stage."
        canonicalPath={`/academy/${slug}`}
        noIndex
      />
      <CaseWorkspaceView slug={slug} />
    </>
  )
}
