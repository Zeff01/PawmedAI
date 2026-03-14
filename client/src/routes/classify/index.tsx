import { createFileRoute } from '@tanstack/react-router'

import { ClassifyDiseaseView } from '#/features/classify-dss/ClassifyDiseaseView'
import { Seo } from '#/components/Seo'

export const Route = createFileRoute('/classify/')({
  component: ClassifyDiseasePage,
})

function ClassifyDiseasePage() {
  return (
    <section className="bg-[#ffffff]" aria-labelledby="classify-title">
      <Seo
        title="Classify Disease | Pawmed AI"
        description="Upload a clinical photo to generate a structured diagnostic brief for veterinary care."
        canonicalPath="/classify"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Pawmed AI',
          applicationCategory: 'MedicalApplication',
          operatingSystem: 'Web',
          description:
            'AI-assisted veterinary diagnostics for faster, clearer clinical decisions.',
        }}
      />
      <header className="bg-blue-600 px-5 py-3 md:px-30 text-white">
        <h1 id="classify-title" className="text-xl font-bold">
          Classify Disease
        </h1>
        <p className="text-sm text-blue-200">
          Upload a clinical photo to generate a structured diagnostic brief.
        </p>
      </header>

      <div className="p-5 md:py-10 xl:px-30 space-y-5">
        <ClassifyDiseaseView />
      </div>
    </section>
  )
}
