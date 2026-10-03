import { createFileRoute } from '@tanstack/react-router'

import { FeedbackFollowUpView } from '@/features/classify-dss/FeedbackFollowUpView'
import { Seo } from '@/components/Seo'
import { RoutePending } from '@/components/RoutePending'
import { requireAuth } from '@/lib/authGuard'

export const Route = createFileRoute('/classify/feedback/$id')({
  beforeLoad: requireAuth,
  component: FeedbackFollowUpPage,
  pendingComponent: RoutePending,
})

function FeedbackFollowUpPage() {
  const { id } = Route.useParams()

  return (
    <div className="min-h-full bg-slate-50">
      <Seo
        title="How did the vet visit go? | Pawmed AI"
        description="Tell us whether PawMed AI's suggestion was right."
        canonicalPath={`/classify/feedback/${id}`}
        noIndex
      />
      <FeedbackFollowUpView id={id} />
    </div>
  )
}
