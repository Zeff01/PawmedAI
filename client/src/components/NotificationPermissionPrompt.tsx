import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { isPushSupported, subscribeToPush } from '@/pwa/push'

const DISMISS_KEY = 'pawmed-notification-prompt-dismissed'

export function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const supported = useMemo(() => isPushSupported(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!supported) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem(DISMISS_KEY)) return
    setVisible(true)
  }, [supported])

  const handleLater = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const handleEnable = async () => {
    setLoading(true)
    try {
      await subscribeToPush()
    } catch {
      if ('Notification' in window) {
        await Notification.requestPermission()
      }
    } finally {
      localStorage.setItem(DISMISS_KEY, '1')
      setVisible(false)
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,28,63,0.16)] backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Enable notifications?
          </p>
          <p className="text-xs text-slate-500">
            Get alerts when your diagnostic brief is ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-full px-4 text-[11px] font-semibold"
            onClick={handleEnable}
            disabled={loading}
          >
            Allow
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full px-3 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
            onClick={handleLater}
            disabled={loading}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  )
}
