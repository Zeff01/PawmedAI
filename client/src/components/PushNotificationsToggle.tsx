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
