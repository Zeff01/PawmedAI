import { supabase } from '@/lib/supabase'

const DEFAULT_BASE_URL = 'http://localhost:8000'
function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.toString() ?? DEFAULT_BASE_URL
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

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

export async function showLocalNotification({
  title,
  body,
  url,
}: {
  title: string
  body: string
  url?: string
}) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(title, {
    body,
    icon: '/favicon/web-app-manifest-512x512.png',
    badge: '/icons/paw-badge-96.png',
    data: { url: url ?? '/' },
  })
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

  await saveSubscription(subscription)
  return subscription
}

/**
 * Store the subscription on the server. Signed in, the token goes along so the
 * device is linked to the account — that is what lets a reminder reach this
 * user's devices rather than everyone's.
 */
async function saveSubscription(subscription: PushSubscription) {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  const response = await fetch(`${getApiBaseUrl()}/api/push/subscribe/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      user_agent: navigator.userAgent,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to save subscription.')
  }
}

/**
 * Link a device that allowed notifications before signing in. Quiet by
 * design: it never asks for permission, and does nothing without it.
 */
export async function linkPushSubscriptionToAccount() {
  if (!isPushSupported() || Notification.permission !== 'granted') return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) await saveSubscription(subscription)
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
