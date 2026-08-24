import { createFileRoute } from '@tanstack/react-router'

import { MedicalLogView } from '@/features/cbc-analyzer/MedicalLogView'
import { ProfessionalGate } from '@/features/cbc-analyzer/components/ProfessionalGate'
import { Seo } from '@/components/Seo'
import { RoutePending } from '@/components/RoutePending'
import { requireAuth } from '@/lib/authGuard'
import { buildBreadcrumbSchema } from '@/utils/seo-schema'

export const Route = createFileRoute('/medical-log/')({
  beforeLoad: requireAuth,
  component: MedicalLogPage,
  pendingComponent: RoutePending,
})

function MedicalLogPage() {
  const description =
    'Every saved CBC analysis for your patients, filterable by species, result status, and date, with CSV export.'

  return (
    <div className="bg-white">
      <Seo
        title="Medical Log | Pawmed AI"
        description={description}
        canonicalPath="/medical-log"
        noIndex
        structuredData={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'CBC Analyzer', path: '/cbc-analyzer' },
            { name: 'Medical Log', path: '/medical-log' },
          ]),
        ]}
      />
      <ProfessionalGate>
        <MedicalLogView />
      </ProfessionalGate>
    </div>
  )
}
