type StructuredDataOptions = {
  pageUrl?: string
  description: string
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://pawmed-ai.pages.dev'
const LOGO_URL = `${SITE_URL}/icons/paw.png`
const OG_IMAGE_URL = `${SITE_URL}/images/hero_image.jpg`

export function buildSoftwareApplicationSchema({
  pageUrl,
  description,
}: StructuredDataOptions): Record<string, unknown> {
  const resolvedPageUrl = pageUrl
    ? new URL(pageUrl, SITE_URL).toString()
    : SITE_URL

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Pawmed AI',
    alternateName: 'PawmedAI',
    applicationCategory: 'MedicalApplication',
    operatingSystem: 'Web',
    url: resolvedPageUrl,
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    image: OG_IMAGE_URL,
  }
}

export function buildSiteSchemas(): Array<Record<string, unknown>> {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pawmed AI',
    alternateName: 'PawmedAI',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: 512,
      height: 512,
    },
    description:
      'AI-powered veterinary diagnostics platform that transforms clinical pet photos into structured diagnostic briefs for vets, students, and pet owners.',
  }

  return [
    organization,
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Pawmed AI',
      alternateName: 'PawmedAI',
      url: SITE_URL,
      description:
        'AI-powered veterinary diagnostics that transforms clinical pet photos into structured diagnostic briefs.',
      publisher: organization,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/classify?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ]
}
