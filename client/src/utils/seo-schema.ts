type StructuredDataOptions = {
  pageUrl?: string
  description: string
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://pawmed-ai.pages.dev'
const LOGO_URL = `${SITE_URL}/icons/paw.png`

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
    applicationCategory: 'MedicalApplication',
    operatingSystem: 'Web',
    url: resolvedPageUrl,
    description,
  }
}

export function buildSiteSchemas(): Array<Record<string, unknown>> {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Pawmed AI',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Pawmed AI',
      url: SITE_URL,
      publisher: {
        '@type': 'Organization',
        name: 'Pawmed AI',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: LOGO_URL,
        },
      },
    },
  ]
}
