import { createFileRoute } from '@tanstack/react-router'

import { RecordDetailView } from '@/features/cbc-analyzer/RecordDetailView'
import { ProfessionalGate } from '@/features/cbc-analyzer/components/ProfessionalGate'
import { Seo } from '@/components/Seo'
import { RoutePending } from '@/components/RoutePending'
import { requireAuth } from '@/lib/authGuard'

export const Route = createFileRoute('/medical-log/$recordId')({
  beforeLoad: requireAuth,
  component: RecordDetailPage,
  pendingComponent: RoutePending,
})

function RecordDetailPage() {
  const { recordId } = Route.useParams()

  return (
    <div className="bg-white">
      <Seo
        title={`Record ${recordId} | Pawmed AI`}
        description="Full CBC analysis record with flagged blood values, sample quality, and clinical notes."
        canonicalPath={`/medical-log/${recordId}`}
        noIndex
      />
      <ProfessionalGate>
        <RecordDetailView recordId={recordId} />
      </ProfessionalGate>
    </div>
  )
}
