export type BreedReferencePhoto = {
  imageUrl: string
  pageUrl: string
  title: string
  summary: string
}

const WIKI_ENDPOINT = 'https://en.wikipedia.org/w/api.php'
const THUMB_SIZE = 640

/**
 * Breed names the model returns when it could not pin down a breed. There is no
 * meaningful reference photo for these, so don't spend a request on them.
 */
const UNRESOLVABLE_NAMES = new Set([
  'mixed breed',
  'mixed',
  'mixed-breed',
  'unknown',
  'unidentified',
  'not identified',
  'n/a',
  'none',
])

type WikiPage = {
  title?: string
  description?: string
  fullurl?: string
  thumbnail?: { source?: string }
  pageprops?: Record<string, unknown>
  missing?: string
}

async function lookupWikipedia(
  title: string,
): Promise<BreedReferencePhoto | null> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*', // Wikipedia requires this for a CORS-enabled anonymous request.
    redirects: '1',
    prop: 'pageimages|description|info|pageprops',
    piprop: 'thumbnail',
    pithumbsize: String(THUMB_SIZE),
    inprop: 'url',
    titles: title,
  })

  let body: unknown
  try {
    const res = await fetch(`${WIKI_ENDPOINT}?${params.toString()}`)
    if (!res.ok) return null
    body = await res.json()
  } catch {
    return null
  }

  const pages = (body as { query?: { pages?: Record<string, WikiPage> } })
    ?.query?.pages
  const page = pages ? Object.values(pages)[0] : undefined
  if (!page || page.missing !== undefined) return null

  // Disambiguation pages ("Siamese", "Persian") carry no representative photo.
  if (page.pageprops && 'disambiguation' in page.pageprops) return null

  const imageUrl = page.thumbnail?.source
  if (!imageUrl || !page.fullurl) return null

  return {
    imageUrl,
    pageUrl: page.fullurl,
    title: page.title ?? title,
    summary: page.description ?? '',
  }
}

/**
 * Find a representative photo of a breed so the user can compare it against
 * their own pet. Returns null whenever no confident match exists — the caller
 * should simply render nothing rather than showing a possibly-wrong animal.
 */
export async function fetchBreedReferencePhoto(
  breedName: string,
  animalType?: string,
): Promise<BreedReferencePhoto | null> {
  const name = breedName?.trim() ?? ''
  if (!name || UNRESOLVABLE_NAMES.has(name.toLowerCase())) return null

  const direct = await lookupWikipedia(name)
  if (direct) return direct

  // Bare breed names are often ambiguous — "Siamese" and "Persian" both resolve
  // to disambiguation pages, while "Siamese cat" is the actual breed article.
  const species = animalType?.trim()
  if (species && !name.toLowerCase().includes(species.toLowerCase())) {
    return lookupWikipedia(`${name} ${species}`)
  }

  return null
}
