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
