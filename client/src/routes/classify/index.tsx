import { createFileRoute } from '@tanstack/react-router'

import { ClassifyDiseaseView } from '@/features/classify-dss/ClassifyDiseaseView'
import { Seo } from '@/components/Seo'
import { useUserType } from '@/hooks/useUserType'
import { requireAuth } from '@/lib/authGuard'
import {
  buildSoftwareApplicationSchema,
  buildMedicalWebPageSchema,
  buildBreadcrumbSchema,
} from '@/utils/seo-schema'

export const Route = createFileRoute('/classify/')({
  beforeLoad: requireAuth,
  component: ClassifyDiseasePage,
})

function ClassifyDiseasePage() {
  const { isProfessional } = useUserType()

  const description =
    'Upload a clinical pet photo and get an AI-generated veterinary diagnostic brief with differential diagnoses, observations, and next steps — in under 5 minutes.'

  return (
    <section
      className="bg-[#ffffff]"
      // The label lives in the banner below; without it the professional shell
      // header names the page instead, so pointing at a missing id would only
      // leave the section unlabelled.
      aria-labelledby={isProfessional ? undefined : 'classify-title'}
      aria-label={isProfessional ? 'Classify Disease' : undefined}
    >
      <Seo
        title="Classify Disease | Pawmed AI"
        description={description}
        keywords="classify animal disease, veterinary disease classification, AI diagnostic brief, pet disease AI, differential diagnosis vet, clinical photo upload, pawmed ai classify"
        canonicalPath="/classify"
        ogImage="/images/feature-brief.jpg"
        ogImageAlt="Pawmed AI disease classification — upload a clinical pet photo to get a diagnostic brief"
        structuredData={[
          buildSoftwareApplicationSchema({ pageUrl: '/classify', description }),
          buildMedicalWebPageSchema({ pageUrl: '/classify', description }),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Classify Disease', path: '/classify' },
          ]),
        ]}
      />
      {!isProfessional && (
        <header className="bg-blue-600 px-5 py-3 md:px-30 text-white">
          <h1 id="classify-title" className="text-xl font-bold">
            Classify Disease
          </h1>
          <p className="text-sm text-blue-200">
            Upload a clinical photo to generate a structured diagnostic brief.
          </p>
        </header>
      )}

      <div className="p-5 md:py-10 xl:px-30 space-y-5">
        <ClassifyDiseaseView />
      </div>
    </section>
  )
}
