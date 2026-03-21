# 7) Customization Options (with examples)

---

## A) Move or remove notification UI

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

---

## B) Edit notification payload

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

---

## C) Change icons

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

---

## D) Caching strategy

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

