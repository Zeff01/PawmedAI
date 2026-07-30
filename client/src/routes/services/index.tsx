import { createFileRoute } from '@tanstack/react-router'

import { ServicesView } from '@/features/services/ServicesView'
import { Seo } from '@/components/Seo'
import { buildBreadcrumbSchema } from '@/utils/seo-schema'

export const Route = createFileRoute('/services/')({
  component: ServicesPage,
})

function ServicesPage() {
  const description =
    'Explore Pawmed AI services for disease classification, breed recognition, and nearby vet discovery.'

  return (
    <>
      <Seo
        title="Services | Pawmed AI"
        description={description}
        keywords="pawmed ai services, veterinary AI services, disease classification, breed recognition, nearby vet discovery"
        canonicalPath="/services"
        ogImage="/images/hero_image.jpg"
        ogImageAlt="Pawmed AI services overview"
        structuredData={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
          ]),
        ]}
      />
      <ServicesView />
    </>
  )
}
