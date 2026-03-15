import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  CameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'

/* ─── Props ──────────────────────────────────────────────── */
export interface CameraModalProps {
  /** Called with the captured File when the user confirms "Use this photo" */
  onCapture: (file: File) => void
  /** Called when the modal should close (X, backdrop click, or after capture) */
  onClose: () => void
}

/* ─── Component ──────────────────────────────────────────── */
export function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [ready, setReady] = React.useState(false)
  const [captured, setCaptured] = React.useState<string | null>(null)

  /* Start webcam stream on mount */
  React.useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setReady(true)
          }
        }
      } catch {
        if (!cancelled) {
          setError(
            'Could not access the camera. Please allow camera permissions and try again.',
          )
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  /* Handlers */
  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCaptured(dataUrl)
    // Freeze the stream while the user reviews the snapshot
    streamRef.current?.getTracks().forEach((t) => (t.enabled = false))
  }

  const handleRetake = () => {
    setCaptured(null)
    streamRef.current?.getTracks().forEach((t) => (t.enabled = true))
  }

  const handleUsePhoto = () => {
    if (!captured) return
    const byteString = atob(captured.split(',')[1])
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
    const blob = new Blob([ab], { type: 'image/jpeg' })
    const file = new File([blob], `pawmed-capture.jpg`, {
      type: 'image/jpeg',
    })
    onCapture(file)
    onClose()
  }

  const handleClose = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onClose()
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <CameraIcon className="h-4 w-4 text-blue-400" />
            <p className="text-[13px] font-bold text-white">Take a Photo</p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${captured ? 'hidden' : 'block'}`}
            playsInline
            muted
          />

          {captured && (
            <img
              src={captured}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          )}

          {/* Spinner while camera initialises */}
          {!ready && !error && !captured && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-[12px] text-slate-400">Starting camera…</p>
            </div>
          )}

          {/* Permission / device error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <CameraIcon className="h-10 w-10 text-slate-600" />
              <p className="text-[12.5px] text-slate-400">{error}</p>
            </div>
          )}

          {/* Viewfinder corner brackets */}
          {ready && !captured && (
            <div className="pointer-events-none absolute inset-0">
              {[
                'top-4 left-4 border-t-2 border-l-2 rounded-tl-lg',
                'top-4 right-4 border-t-2 border-r-2 rounded-tr-lg',
                'bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg',
                'bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg',
              ].map((cls, i) => (
                <div
                  key={i}
                  className={`absolute h-6 w-6 border-blue-400 ${cls}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Hidden canvas used for snapshot extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Footer actions */}
        <div className="flex items-center justify-center gap-3 border-t border-slate-700 px-5 py-4">
          {!captured ? (
            /* Shutter button */
            <button
              onClick={handleCapture}
              disabled={!ready}
              title="Take photo"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="h-11 w-11 rounded-full border-2 border-slate-300 bg-white" />
            </button>
          ) : (
            /* Post-capture actions */
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-[12px] font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                <ArrowUpTrayIcon className="h-3.5 w-3.5 rotate-180" />
                Retake
              </button>
              <button
                onClick={handleUsePhoto}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-500"
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Use this photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
