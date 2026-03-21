# 2) Push Notifications (Client)

This section covers the client-side subscription flow and UI.

---

## 2.1 Push Helper

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

---

## 2.2 Push UI Component

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

---

## 2.3 Place the UI

File: `client/src/routes/__root.tsx`

```tsx
<footer className="border-t border-slate-100 bg-white/60 px-5 py-6 text-center text-xs text-slate-400">
  <div className="mb-3 flex justify-center">
    <PushNotificationsToggle />
  </div>
  <p>Pawmed AI • Veterinary diagnostics</p>
</footer>
```

