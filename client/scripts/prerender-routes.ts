import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Per-route HTML prerender.
 *
 * The SPA ships a single dist/index.html. When Google crawls a sub-route
 * (e.g. /animals/dog or /lifecycle) the host serves that same HTML, so every
 * URL appears to share the same <title>, <meta description>, and canonical.
 * That collapses the URLs into duplicates in Search Console and is the root
 * cause of "Duplicate, Google chose different canonical than user" plus most
 * "Discovered – currently not indexed" entries.
 *
 * This script writes a route-specific HTML file at dist/<route>/index.html for
 * every known static route and every animal slug, replacing the head injection
 * marker with route-specific title/description/canonical/OG/JSON-LD tags.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const ANIMALS_JSON = path.join(ROOT, 'public', 'animals.json')

const SITE_URL = (process.env.SITE_URL ?? 'https://pawmedai.com').replace(/\/$/, '')
const DEFAULT_TITLE = 'Pawmed AI | Veterinary Diagnostics'
const DEFAULT_DESCRIPTION =
  'Pawmed AI turns clinical pet photos into structured diagnostic briefs in under 5 minutes. AI-powered veterinary diagnostics for vets, students, and pet owners.'
const DEFAULT_OG_IMAGE = '/images/hero_image.jpg'
const TWITTER_HANDLE = '@pawmedai'

type RouteMeta = {
  path: string
  title: string
  description: string
  ogImage?: string
  ogImageAlt?: string
  keywords?: string
  jsonLd?: Array<Record<string, unknown>>
}

const HEAD_INJECT_RE =
  /<!-- SEO_HEAD_INJECT -->[\s\S]*?<!-- \/SEO_HEAD_INJECT -->/

const TITLE_TAG_RE = /<title>[\s\S]*?<\/title>/
const META_DESCRIPTION_RE = /<meta\s+name="description"[^>]*>/
const META_KEYWORDS_RE = /<meta\s+name="keywords"[^>]*>/
const OG_TITLE_RE = /<meta\s+property="og:title"[^>]*>/
const OG_DESCRIPTION_RE = /<meta\s+property="og:description"[^>]*>/
const OG_URL_RE = /<meta\s+property="og:url"[^>]*>/
const OG_IMAGE_RE = /<meta\s+property="og:image"[^>]*>/
const OG_IMAGE_ALT_RE = /<meta\s+property="og:image:alt"[^>]*>/
const TWITTER_TITLE_RE = /<meta\s+name="twitter:title"[^>]*>/
const TWITTER_DESCRIPTION_RE = /<meta\s+name="twitter:description"[^>]*>/
const TWITTER_IMAGE_RE = /<meta\s+name="twitter:image"[^>]*>/
const TWITTER_IMAGE_ALT_RE = /<meta\s+name="twitter:image:alt"[^>]*>/
const STATIC_LD_JSON_RE =
  /<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const toAbsolute = (urlOrPath: string) =>
  urlOrPath.startsWith('http')
    ? urlOrPath
    : `${SITE_URL}${urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`}`

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

const buildBreadcrumb = (
  items: Array<{ name: string; path: string }>
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: toAbsolute(item.path),
  })),
})

const buildSiteSchemas = (): Array<Record<string, unknown>> => {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pawmed AI',
    alternateName: 'PawmedAI',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icons/paw.png`,
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

const STATIC_ROUTES: RouteMeta[] = [
  {
    path: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: 'Pawmed AI — AI-powered veterinary diagnostics platform',
    keywords:
      'veterinary diagnostics, AI vet, animal disease classification, clinical diagnostic brief, veterinary AI, pet diagnostics, vet AI tool, animal health AI, pawmed, pawmed ai',
    jsonLd: [
      ...buildSiteSchemas(),
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Pawmed AI',
        alternateName: 'PawmedAI',
        applicationCategory: 'MedicalApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      buildBreadcrumb([{ name: 'Home', path: '/' }]),
    ],
  },
  {
    path: '/classify',
    title: 'Classify Disease | Pawmed AI',
    description:
      'Upload a clinical pet photo and get an AI-generated veterinary diagnostic brief with differential diagnoses, observations, and next steps — in under 5 minutes.',
    ogImage: '/images/feature-brief.jpg',
    ogImageAlt:
      'Pawmed AI disease classification — upload a clinical pet photo to get a diagnostic brief',
    keywords:
      'classify animal disease, veterinary disease classification, AI diagnostic brief, pet disease AI, differential diagnosis vet, clinical photo upload, pawmed ai classify',
    jsonLd: [
      buildBreadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Classify Disease', path: '/classify' },
      ]),
    ],
  },
  {
    path: '/classify-breed',
    title: 'Classify Breed | Pawmed AI',
    description:
      'Identify dog, cat, and other animal breeds from a single photo. Pawmed AI returns the breed, scientific classification, and a quick at-a-glance profile.',
    ogImage: '/images/feature-brief.jpg',
    ogImageAlt:
      'Pawmed AI breed classification — identify a pet breed from a photo',
    keywords:
      'classify breed, dog breed identifier, cat breed identifier, animal breed AI, identify pet from photo, pawmed ai classify breed',
    jsonLd: [
      buildBreadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Classify Breed', path: '/classify-breed' },
      ]),
    ],
  },
  {
    path: '/nearby-vets',
    title: 'Find a Vet Near You | Pawmed AI',
    description:
      'Locate the nearest veterinary clinics on a live map. Get directions, phone numbers, and distances — powered by Pawmed AI.',
    ogImage: '/images/hero-vet.jpg',
    ogImageAlt:
      "Find a veterinary clinic near you with Pawmed AI's live vet locator map",
    keywords:
      'find vet near me, nearest veterinary clinic, vet locator map, animal hospital near me, emergency vet, pawmed ai nearby vets',
    jsonLd: [
      buildBreadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Find a Vet Near You', path: '/nearby-vets' },
      ]),
    ],
  },
  {
    path: '/lifecycle',
    title: 'Lifecycle Notes & Release Updates | Pawmed AI',
    description:
      'Pawmed AI release notes: current beta status, supported features, known limitations, accuracy disclaimers, and how to share feedback with the team.',
    ogImage: '/images/feature-notes.jpg',
    ogImageAlt: 'Pawmed AI lifecycle notes and release updates',
    keywords:
      'pawmed ai release notes, pawmed changelog, veterinary AI updates, pawmed beta status, pawmed lifecycle, pawmed ai roadmap',
    jsonLd: [
      buildBreadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Lifecycle Notes', path: '/lifecycle' },
      ]),
    ],
  },
]

const buildAnimalRoutes = async (): Promise<RouteMeta[]> => {
  const raw = await readFile(ANIMALS_JSON, 'utf8')
  const animals: Array<{
    name: string
    description?: string
    image?: string
    scientific_name?: string
    category?: string
    status?: string
  }> = JSON.parse(raw)

  return animals.map((animal) => {
    const slug = slugify(animal.name)
    const path = `/animals/${slug}`
    const cleanDescription = (animal.description ?? '').trim()
    const description = cleanDescription
      ? `${animal.name} — ${cleanDescription}. Explore classification, lifespan, behavior, conservation status, and key facts on Pawmed AI.`
      : `${animal.name} profile on Pawmed AI: scientific classification, lifespan, lifecycle, behavior, conservation status, and key facts.`
    const title = animal.scientific_name
      ? `${animal.name} (${animal.scientific_name}) — Profile, Lifespan & Facts | Pawmed AI`
      : `${animal.name} — Profile, Lifespan & Facts | Pawmed AI`
    const keywordParts = [
      animal.name,
      animal.scientific_name,
      animal.category,
      `${animal.name} facts`,
      `${animal.name} lifespan`,
      `${animal.name} habitat`,
      'pawmed ai animal profile',
    ].filter(Boolean) as string[]

    const articleSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${animal.name} — Profile & Facts`,
      description,
      mainEntityOfPage: toAbsolute(path),
      image: animal.image ? [animal.image] : [toAbsolute(DEFAULT_OG_IMAGE)],
      author: { '@type': 'Organization', name: 'Pawmed AI' },
      publisher: {
        '@type': 'Organization',
        name: 'Pawmed AI',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icons/paw.png`,
        },
      },
    }

    return {
      path,
      title,
      description,
      ogImage: animal.image ?? DEFAULT_OG_IMAGE,
      ogImageAlt: `${animal.name}${animal.scientific_name ? ` (${animal.scientific_name})` : ''} — Pawmed AI animal profile`,
      keywords: keywordParts.join(', '),
      jsonLd: [
        articleSchema,
        buildBreadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Classify Breed', path: '/classify-breed' },
          { name: animal.name, path },
        ]),
      ],
    }
  })
}

const renderHead = (route: RouteMeta) => {
  const url = toAbsolute(route.path)
  const image = toAbsolute(route.ogImage ?? DEFAULT_OG_IMAGE)
  const imageAlt = route.ogImageAlt ?? route.title
  const lines = [`<link rel="canonical" href="${url}" />`]
  if (route.jsonLd && route.jsonLd.length) {
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>`
    )
  }
  return {
    headInject: lines.join('\n    '),
    title: route.title,
    description: route.description,
    keywords: route.keywords,
    url,
    image,
    imageAlt,
  }
}

const transformHtml = (template: string, route: RouteMeta) => {
  const head = renderHead(route)
  const titleTag = `<title>${escapeHtml(head.title)}</title>`
  const descriptionTag = `<meta name="description" content="${escapeHtml(head.description)}" />`
  const keywordsTag = head.keywords
    ? `<meta name="keywords" content="${escapeHtml(head.keywords)}" />`
    : ''
  const ogTitleTag = `<meta property="og:title" content="${escapeHtml(head.title)}" />`
  const ogDescTag = `<meta property="og:description" content="${escapeHtml(head.description)}" />`
  const ogUrlTag = `<meta property="og:url" content="${head.url}" />`
  const ogImageTag = `<meta property="og:image" content="${head.image}" />`
  const ogImageAltTag = `<meta property="og:image:alt" content="${escapeHtml(head.imageAlt)}" />`
  const twitterTitleTag = `<meta name="twitter:title" content="${escapeHtml(head.title)}" />`
  const twitterDescTag = `<meta name="twitter:description" content="${escapeHtml(head.description)}" />`
  const twitterImageTag = `<meta name="twitter:image" content="${head.image}" />`
  const twitterImageAltTag = `<meta name="twitter:image:alt" content="${escapeHtml(head.imageAlt)}" />`
  const jsonLd = head.headInject

  let html = template
  html = html.replace(TITLE_TAG_RE, titleTag)
  html = html.replace(META_DESCRIPTION_RE, descriptionTag)
  html = META_KEYWORDS_RE.test(html)
    ? html.replace(META_KEYWORDS_RE, keywordsTag)
    : html
  html = html.replace(OG_TITLE_RE, ogTitleTag)
  html = html.replace(OG_DESCRIPTION_RE, ogDescTag)
  html = html.replace(OG_URL_RE, ogUrlTag)
  html = html.replace(OG_IMAGE_RE, ogImageTag)
  html = html.replace(OG_IMAGE_ALT_RE, ogImageAltTag)
  html = html.replace(TWITTER_TITLE_RE, twitterTitleTag)
  html = html.replace(TWITTER_DESCRIPTION_RE, twitterDescTag)
  html = html.replace(TWITTER_IMAGE_RE, twitterImageTag)
  html = html.replace(TWITTER_IMAGE_ALT_RE, twitterImageAltTag)
  // Drop the static JSON-LD that's hardcoded in index.html — we replace it
  // with route-specific JSON-LD via the head injection slot.
  html = html.replace(STATIC_LD_JSON_RE, '')
  html = html.replace(HEAD_INJECT_RE, jsonLd)
  // Twitter creator/site already in template — leave alone.
  // Add a Twitter handle if missing.
  if (!html.includes('twitter:site')) {
    html = html.replace(
      twitterTitleTag,
      `<meta name="twitter:site" content="${TWITTER_HANDLE}" />\n    ${twitterTitleTag}`
    )
  }
  return html
}

const writeRoute = async (template: string, route: RouteMeta) => {
  const html = transformHtml(template, route)
  if (route.path === '/') {
    await writeFile(path.join(DIST, 'index.html'), html)
    return
  }
  const dir = path.join(DIST, route.path.replace(/^\//, ''))
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'index.html'), html)
}

const ensureSpaFallback = async () => {
  // Cloudflare Pages SPA fallback for any route we did not prerender.
  const redirectsPath = path.join(DIST, '_redirects')
  let existing = ''
  try {
    existing = await readFile(redirectsPath, 'utf8')
  } catch {
    /* file may not exist */
  }
  const fallback = '/* /index.html 200'
  if (!existing.includes(fallback)) {
    const next = `${existing.trimEnd()}\n${fallback}\n`
    await writeFile(redirectsPath, next)
  }
}

const main = async () => {
  const distIndexPath = path.join(DIST, 'index.html')
  const cachedTemplatePath = path.join(DIST, '.seo-template.html')

  // After the first prerender, dist/index.html has the home-route head tags
  // baked in (no marker). Cache the marker-bearing version so re-running
  // `prerender` standalone keeps working.
  let template: string
  if (
    (await readFile(distIndexPath, 'utf8').then((s) => HEAD_INJECT_RE.test(s)).catch(() => false))
  ) {
    template = await readFile(distIndexPath, 'utf8')
    await writeFile(cachedTemplatePath, template)
  } else {
    try {
      template = await readFile(cachedTemplatePath, 'utf8')
    } catch {
      throw new Error(
        'No SEO_HEAD_INJECT marker found in dist/index.html and no cached template at dist/.seo-template.html. Run `pnpm build` to regenerate the bundle.'
      )
    }
  }

  if (!HEAD_INJECT_RE.test(template)) {
    throw new Error(
      'Could not find SEO_HEAD_INJECT marker in template — did the index.html template change?'
    )
  }

  const animalRoutes = await buildAnimalRoutes()
  const routes = [...STATIC_ROUTES, ...animalRoutes]

  for (const route of routes) {
    await writeRoute(template, route)
  }

  // Cloudflare Pages will serve dist/index.html as 404 fallback by default;
  // duplicate it to 404.html so the runtime SPA can still pick up unknown
  // routes without a 404 status.
  await copyFile(
    path.join(DIST, 'index.html'),
    path.join(DIST, '404.html')
  )

  await ensureSpaFallback()

  console.log(
    `Prerendered ${routes.length} routes (${STATIC_ROUTES.length} static, ${animalRoutes.length} animals).`
  )
}

main().catch((error) => {
  console.error('Prerender failed:', error)
  process.exit(1)
})
