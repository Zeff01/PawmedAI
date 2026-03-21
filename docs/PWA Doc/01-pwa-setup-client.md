# 1) PWA Setup (Client)

This section covers enabling PWA installability and the service worker in the client.

---

## 1.1 Install Dependencies

From `client/`:

```bash
pnpm add -D vite-plugin-pwa
pnpm add workbox-window
```

---

## 1.2 Update Vite Config

File: `client/vite.config.ts`

```ts
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
      includeAssets: [
        'favicon/favicon.ico',
        'favicon/favicon.svg',
        'favicon/apple-touch-icon.png',
        'favicon/web-app-manifest-192x192.png',
        'favicon/web-app-manifest-512x512.png',
        'icons/paw.png',
      ],
      manifest: {
        name: 'Pawmed AI | Veterinary Diagnostics',
        short_name: 'Pawmed AI',
        description:
          'AI-assisted veterinary diagnostics for faster, clearer clinical decisions.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        icons: [
          {
            src: '/favicon/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/favicon/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})

export default config
```

---

## 1.3 Add the Service Worker

File: `client/src/sw.ts`

```ts
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
        icon: '/icons/paw.png',
        badge: '/favicon/favicon.ico',
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
```

---

## 1.4 Register the Service Worker

File: `client/src/main.tsx`

```ts
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { registerSW } from 'virtual:pwa-register'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

const queryClient = new QueryClient()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  registerSW({ immediate: true })
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
```

---

## 1.5 Manifest

File: `client/public/manifest.json`

```json
{
  "short_name": "Pawmed AI",
  "name": "Pawmed AI | Veterinary Diagnostics",
  "icons": [
    {
      "src": "/favicon/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicon/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff"
}
```

---

## PWA Install Test (Quick)

1. Run the client on HTTPS (or use production). `localhost` works for dev testing only.
2. Open Chrome → click the install icon in the address bar.
3. Install and launch the PWA.
4. Verify it opens as a standalone app (no browser UI).

---

## PWA Debug Tips

- DevTools → Application → Manifest (check fields, icons).
- DevTools → Application → Service Workers (check active SW).
- Lighthouse → PWA audit.

