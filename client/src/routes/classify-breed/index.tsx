import ClassifyBreedView from '@/features/classify-breed/ClassifyBreedView'
import { createFileRoute } from '@tanstack/react-router'
import { Seo } from '@/components/Seo'
import { buildBreadcrumbSchema } from '@/utils/seo-schema'

export const Route = createFileRoute('/classify-breed/')({
  component: RouteComponent,
})

function RouteComponent() {
  const description =
    'Identify dog, cat, and other animal breeds from a single photo. Pawmed AI returns the breed, scientific classification, and a quick at-a-glance profile.'
  return (
    <div>
      <Seo
        title="Classify Breed | Pawmed AI"
        description={description}
        keywords="classify breed, dog breed identifier, cat breed identifier, animal breed AI, identify pet from photo, pawmed ai classify breed"
        canonicalPath="/classify-breed"
        ogImage="/images/feature-brief.jpg"
        ogImageAlt="Pawmed AI breed classification — identify a pet breed from a photo"
        structuredData={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Classify Breed', path: '/classify-breed' },
          ]),
        ]}
      />
      <ClassifyBreedView />
    </div>
  )
}
