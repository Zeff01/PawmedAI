/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({ cacheName: 'pages' })
)

registerRoute(
  ({ request }) =>
    ['script', 'style', 'image', 'font'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'assets' })
)

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let payload: Record<string, unknown> = {}
      if (event.data) {
        try {
          payload = event.data.json()
        } catch {
          const text = await event.data.text()
          payload = { body: text }
        }
      }

      const title =
        typeof payload.title === 'string' ? payload.title : 'Pawmed AI'
      const body =
        typeof payload.body === 'string'
          ? payload.body
          : 'You have a new update.'
      const url = typeof payload.url === 'string' ? payload.url : '/'

      const options: NotificationOptions = {
        body,
        icon: '/favicon/web-app-manifest-512x512.png',
        badge: '/favicon/favicon-96x96.png',
        data: { url },
      }

      await self.registration.showNotification(title, options)
    })()
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data as { url?: string })?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          if (client.url === targetUrl) {
            return client.focus()
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
      return undefined
    })
  )
})
