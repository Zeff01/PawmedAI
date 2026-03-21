# PWA + Push Notifications (Pawmed AI)

This is a detailed, step-by-step guide that includes the exact code and files used in this repo to enable:

- PWA installability
- Service worker caching
- Web push notifications (iOS + Android limitations included)

---

## Table of Contents

1. PWA Setup (Client)
2. Push Notifications (Client)
3. Push Notifications (Server)
4. Environment Variables
5. Testing (Desktop + Android)
6. Testing on iOS
7. Customization Options (with examples)
8. Debug & Troubleshooting

---

## 1) PWA Setup (Client)

### 1.1 Install Dependencies

From `client/`:

```bash
pnpm add -D vite-plugin-pwa
pnpm add workbox-window
```

### 1.2 Update Vite Config

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

### 1.3 Add the Service Worker

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

### 1.4 Register the Service Worker

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

### 1.5 Manifest

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

## 2) Push Notifications (Client)

### 2.1 Push Helper

File: `client/src/pwa/push.ts`

```ts
const DEFAULT_BASE_URL = 'http://localhost:8000'

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export async function fetchVapidPublicKey() {
  const response = await fetch(`${getApiBaseUrl()}/api/push/vapid-public-key/`)
  if (!response.ok) {
    throw new Error('Failed to fetch VAPID public key.')
  }
  const payload = (await response.json()) as { publicKey: string }
  return payload.publicKey
}

export async function subscribeToPush() {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted.')
  }

  const registration = await navigator.serviceWorker.ready
  const publicKey = await fetchVapidPublicKey()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  const response = await fetch(`${getApiBaseUrl()}/api/push/subscribe/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      userAgent: navigator.userAgent,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to save subscription.')
  }

  return subscription
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await fetch(`${getApiBaseUrl()}/api/push/unsubscribe/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })

  await subscription.unsubscribe()
}

export async function getCurrentSubscription() {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function sendTestNotification() {
  const response = await fetch(`${getApiBaseUrl()}/api/push/send-test/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Pawmed AI update',
      body: 'Notifications are working on this device.',
      url: '/',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to send test notification.')
  }
}
```

### 2.2 Push UI Component

File: `client/src/components/PushNotificationsToggle.tsx`

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  getCurrentSubscription,
  isPushSupported,
  sendTestNotification,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/pwa/push'

type Status = 'unsupported' | 'idle' | 'granted' | 'denied' | 'subscribed'

export function PushNotificationsToggle() {
  const [status, setStatus] = useState<Status>('idle')
  const [loading, setLoading] = useState(false)
  const supported = useMemo(() => isPushSupported(), [])

  useEffect(() => {
    if (!supported) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    getCurrentSubscription()
      .then((sub) => {
        setStatus(sub ? 'subscribed' : 'granted')
      })
      .catch(() => setStatus('granted'))
  }, [supported])

  const handleEnable = async () => {
    setLoading(true)
    try {
      await subscribeToPush()
      setStatus('subscribed')
    } catch (error) {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'granted')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      await unsubscribeFromPush()
      setStatus('granted')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setLoading(true)
    try {
      await sendTestNotification()
    } finally {
      setLoading(false)
    }
  }

  if (status === 'unsupported') {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-2 text-xs text-slate-500 md:flex-row md:justify-center">
      <span className="text-center md:text-left">
        Get alerts for new clinical updates.
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {status !== 'subscribed' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-blue-200 px-3 text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
            onClick={handleEnable}
            disabled={loading}
          >
            Enable notifications
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-blue-200 px-3 text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
              onClick={handleTest}
              disabled={loading}
            >
              Send test
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-slate-200 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              onClick={handleDisable}
              disabled={loading}
            >
              Disable
            </Button>
          </>
        )}
      </div>
      {status === 'denied' && (
        <span className="text-[10px] text-amber-600">
          Notifications are blocked in your browser settings.
        </span>
      )}
    </div>
  )
}
```

### 2.3 Place the UI

File: `client/src/routes/__root.tsx`

```tsx
<footer className="border-t border-slate-100 bg-white/60 px-5 py-6 text-center text-xs text-slate-400">
  <div className="mb-3 flex justify-center">
    <PushNotificationsToggle />
  </div>
  <p>Pawmed AI • Veterinary diagnostics</p>
</footer>
```

---

## 3) Push Notifications (Server)

### 3.1 Install Dependency

File: `server/requirements.txt`

```
pywebpush==2.0.3
```

### 3.2 Add App

File: `server/core/settings.py`

```py
INSTALLED_APPS = [
    'rest_framework',
    'classify_dss',
    'notifications',
    'corsheaders',
    ...
]
```

### 3.3 Routes

File: `server/core/urls.py`

```py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('classify_dss.urls')),
    path('api/push/', include('notifications.urls')),
    ...
]
```

### 3.4 Models

File: `server/notifications/models.py`

```py
from django.db import models

class PushSubscription(models.Model):
    endpoint = models.URLField(max_length=2048, unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    user_agent = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3.5 Serializer

File: `server/notifications/serializers.py`

```py
class PushSubscriptionSerializer(serializers.ModelSerializer):
    keys = serializers.DictField(write_only=True)

    class Meta:
        model = PushSubscription
        fields = ["endpoint", "keys", "user_agent"]

    def create(self, validated_data):
        keys = validated_data.pop("keys", {})
        p256dh = keys.get("p256dh")
        auth = keys.get("auth")

        instance, _ = PushSubscription.objects.update_or_create(
            endpoint=validated_data["endpoint"],
            defaults={
                "p256dh": p256dh or "",
                "auth": auth or "",
                "user_agent": validated_data.get("user_agent", ""),
            },
        )
        return instance
```

### 3.6 Views

File: `server/notifications/views.py`

```py
from pywebpush import WebPushException, webpush

class VapidPublicKeyView(APIView):
    def get(self, request):
        return Response({"publicKey": settings.VAPID_PUBLIC_KEY})

class PushSubscribeView(APIView):
    def post(self, request):
        serializer = PushSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": "subscribed"}, status=201)

class PushSendTestView(APIView):
    def post(self, request):
        payload = {
            "title": request.data.get("title"),
            "body": request.data.get("body"),
            "url": request.data.get("url") or "/",
        }
        for subscription in PushSubscription.objects.all():
            try:
                webpush(
                    subscription_info={
                        "endpoint": subscription.endpoint,
                        "keys": {
                            "p256dh": subscription.p256dh,
                            "auth": subscription.auth,
                        },
                    },
                    data=json.dumps(payload),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": settings.VAPID_SUBJECT},
                )
            except WebPushException as exc:
                if getattr(exc.response, "status_code", None) in {404, 410}:
                    subscription.delete()
        return Response({"status": "sent"})
```

### 3.7 URLs

File: `server/notifications/urls.py`

```py
urlpatterns = [
    path("vapid-public-key/", VapidPublicKeyView.as_view()),
    path("subscribe/", PushSubscribeView.as_view()),
    path("unsubscribe/", PushUnsubscribeView.as_view()),
    path("send-test/", PushSendTestView.as_view()),
]
```

---

## 4) Environment Variables

### Server

```
VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY
VAPID_SUBJECT=mailto:your-email@example.com
```

### Client

```
VITE_API_BASE_URL=http://localhost:8000
VITE_SITE_URL=http://localhost:3000
```

---

## 5) Testing (Desktop + Android)

1. Run migrations:
   ```bash
   cd server
   python manage.py migrate
   ```
2. Start dev:
   ```bash
   docker compose --profile dev up -d --build
   ```
3. Open `http://localhost:3000`
4. Click **Enable notifications**
5. Click **Send test**

If no notification:

- Check OS Do Not Disturb
- Check DevTools → Application → Service Workers
- Check `/api/push/send-test/` response

---

## 6) iOS Notes

Push on iOS requires:

- iOS 16.4+
- HTTPS
- PWA installed to Home Screen
- Permissions granted in installed app

Safari tabs on iOS do not receive push.

---

## 7) Customization Options (with examples)

### A) Move or remove notification UI

File: `client/src/routes/__root.tsx`

**Move into header** (example):

```tsx
<header>
  <Header />
  <div className="mt-2 flex justify-center">
    <PushNotificationsToggle />
  </div>
</header>
```

**Remove entirely** (example):

```tsx
// Remove this block from the footer
<PushNotificationsToggle />
```

### B) Edit notification payload

Files:

- `client/src/pwa/push.ts` (payload you send)
- `server/notifications/views.py` (server payload creation)
- `client/src/sw.ts` (payload rendering)

**Example: change test payload**

`client/src/pwa/push.ts`

```ts
body: JSON.stringify({
  title: 'Case update',
  body: 'New AI diagnosis is ready.',
  url: '/classify',
}),
```

**Example: add icon URL from server**

`server/notifications/views.py`

```py
payload = {
  "title": "Case update",
  "body": "New AI diagnosis is ready.",
  "url": "/classify",
  "icon": "/icons/paw.png",
}
```

Then in `client/src/sw.ts`:

```ts
const icon = typeof payload.icon === 'string' ? payload.icon : '/icons/paw.png'
...
icon,
```

### C) Change icons

**Manifest icons** (`client/public/manifest.json`):

```json
"icons": [
  {
    "src": "/icons/app-192.png",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "/icons/app-512.png",
    "sizes": "512x512",
    "type": "image/png"
  }
]
```

**Notification icons** (`client/src/sw.ts`):

```ts
icon: '/icons/app-192.png',
badge: '/icons/app-badge.png',
```

### D) Caching strategy

File: `client/src/sw.ts`

**Example: Cache-first for images**

```ts
import { CacheFirst } from 'workbox-strategies'

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images', plugins: [] })
)
```

**Example: Network-first for pages**

```ts
import { NetworkFirst } from 'workbox-strategies'

registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({ cacheName: 'pages' })
)
```

---

## 8) Debug & Troubleshooting

### Clear subscriptions

```bash
python manage.py shell -c "from notifications.models import PushSubscription; PushSubscription.objects.all().delete()"
```

### Check subscription in browser

```js
await navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription())
```

### Common errors

- `410 Gone`: subscription is stale. Clear and re-subscribe.
- `No Service Worker`: check `client/src/main.tsx` and DevTools.
- `No permissions`: check browser permissions or system focus mode.

