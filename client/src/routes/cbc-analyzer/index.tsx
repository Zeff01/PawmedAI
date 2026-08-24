import { createFileRoute } from '@tanstack/react-router'

import { CbcAnalyzerView } from '@/features/cbc-analyzer/CbcAnalyzerView'
import { ProfessionalGate } from '@/features/cbc-analyzer/components/ProfessionalGate'
import { Seo } from '@/components/Seo'
import { RoutePending } from '@/components/RoutePending'
import { requireAuth } from '@/lib/authGuard'
import { buildBreadcrumbSchema } from '@/utils/seo-schema'

export const Route = createFileRoute('/cbc-analyzer/')({
  beforeLoad: requireAuth,
  component: CbcAnalyzerPage,
  pendingComponent: RoutePending,
})

function CbcAnalyzerPage() {
  const description =
    'Upload a complete blood count and get a structured veterinary diagnostic brief. Every value is flagged against species-specific reference intervals for dogs and cats.'

  return (
    <div className="bg-white">
      <Seo
        title="CBC Analyzer | Pawmed AI"
        description={description}
        keywords="veterinary CBC analyzer, complete blood count interpretation, canine reference intervals, feline haematology, blood panel AI, vet bloodwork software, pawmed ai cbc"
        canonicalPath="/cbc-analyzer"
        ogImage="/images/feature-brief.jpg"
        ogImageAlt="Pawmed AI CBC Analyzer — flagged blood values with a diagnostic brief"
        noIndex
        structuredData={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'CBC Analyzer', path: '/cbc-analyzer' },
          ]),
        ]}
      />
      <ProfessionalGate>
        <CbcAnalyzerView />
      </ProfessionalGate>
    </div>
  )
}
