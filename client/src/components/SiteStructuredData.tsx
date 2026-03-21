import { useEffect } from 'react'
import { buildSiteSchemas } from '#/utils/seo-schema'

function upsertJsonLd(data: Array<Record<string, unknown>>) {
  const id = 'site-jsonld'
  let element = document.head.querySelector(`script#${id}`)
  if (!element) {
    element = document.createElement('script')
    element.setAttribute('type', 'application/ld+json')
    element.setAttribute('id', id)
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(data)
}

export function SiteStructuredData() {
  useEffect(() => {
    upsertJsonLd(buildSiteSchemas())
  }, [])

  return null
}
