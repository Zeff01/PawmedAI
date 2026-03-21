import { useEffect } from 'react'

type SeoProps = {
  title?: string
  description?: string
  canonicalPath?: string
  ogImage?: string
  noIndex?: boolean
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>
}

const DEFAULT_TITLE = 'Pawmed AI | Veterinary Diagnostics'
const DEFAULT_DESCRIPTION =
  'AI-assisted veterinary diagnostics for faster, clearer clinical decisions.'
const DEFAULT_SITE_NAME = 'Pawmed AI'
const DEFAULT_OG_IMAGE = '/icons/paw.png'
const DEFAULT_SITE_URL = import.meta.env.VITE_SITE_URL

function upsertMeta(
  selector: string,
  attributes: Record<string, string>,
  content?: string
) {
  if (!content) return
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value)
  })
  element.setAttribute('content', content)
}

function upsertLink(rel: string, href?: string) {
  if (!href) return
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function upsertJsonLd(data?: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (!data) return
  const id = 'seo-jsonld'
  let element = document.head.querySelector(`script#${id}`)
  if (!element) {
    element = document.createElement('script')
    element.setAttribute('type', 'application/ld+json')
    element.setAttribute('id', id)
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(data)
}

export function Seo({
  title,
  description,
  canonicalPath,
  ogImage,
  noIndex,
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const resolvedTitle = title ?? DEFAULT_TITLE
    const resolvedDescription = description ?? DEFAULT_DESCRIPTION
    const resolvedSiteUrl = DEFAULT_SITE_URL || window.location.origin
    const resolvedImage = ogImage ?? DEFAULT_OG_IMAGE
    const resolvedImageUrl = resolvedImage.startsWith('http')
      ? resolvedImage
      : new URL(resolvedImage, resolvedSiteUrl).toString()
    const resolvedUrl = canonicalPath
      ? new URL(canonicalPath, resolvedSiteUrl).toString()
      : window.location.href

    document.title = resolvedTitle

    upsertMeta('meta[name="description"]', { name: 'description' }, resolvedDescription)
    upsertMeta('meta[name="robots"]', { name: 'robots' }, noIndex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, resolvedTitle)
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, resolvedDescription)
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website')
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, DEFAULT_SITE_NAME)
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, resolvedUrl)
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, resolvedImageUrl)
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, resolvedTitle)
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, resolvedDescription)
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, resolvedImageUrl)

    upsertLink('canonical', resolvedUrl)
    upsertJsonLd(structuredData)
  }, [title, description, canonicalPath, ogImage, noIndex, structuredData])

  return null
}
