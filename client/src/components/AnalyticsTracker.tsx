import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'

export function AnalyticsTracker() {
  if (import.meta.env.MODE !== 'production') {
    return null
  }

  const location = useRouterState({
    select: (state) => state.location,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
    if (!gtag) return

    const search =
      typeof location.search === 'string'
        ? location.search
        : location.searchStr ?? ''
    const pagePath = `${location.pathname}${search}`
    gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title,
    })
  }, [location.pathname, location.search])

  return null
}
