import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import catAnimation from '@/assets/pawmed-cat.json'

const messages = [
  'Our AI vet is sniffing out the diagnosis…',
  'Scanning for symptoms and patterns…',
  'Consulting the medical database…',
  'Almost done, good boy is working hard!',
]

const PAW_COUNT = 5

function PawIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? '#2563eb' : 'none'}
      stroke={filled ? '#2563eb' : '#bfdbfe'}
      strokeWidth="1.5"
      className="transition-all duration-500"
      style={{
        filter: filled ? 'drop-shadow(0 0 4px rgba(37,99,235,0.5))' : 'none',
      }}
    >
      <ellipse cx="12" cy="17" rx="5" ry="4" />
      <ellipse cx="6.5" cy="12.5" rx="2.5" ry="3" />
      <ellipse cx="17.5" cy="12.5" rx="2.5" ry="3" />
      <ellipse cx="9" cy="8.5" rx="2" ry="2.5" />
      <ellipse cx="15" cy="8.5" rx="2" ry="2.5" />
    </svg>
  )
}

function PawMedLoader() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [pawIndex, setPawIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % messages.length)
        setPawIndex((i) => (i + 1) % PAW_COUNT)
        setVisible(true)
      }, 350)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const progressPercent = ((pawIndex + 1) / PAW_COUNT) * 100

  return (
    <>
      <style>{`
        @keyframes floatCat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.12); opacity: 0.15; }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes msgOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-10px); }
        }
        .msg-in     { animation: msgIn  0.35s ease forwards; }
        .msg-out    { animation: msgOut 0.3s  ease forwards; }
        .shimmer-text {
          background: linear-gradient(90deg, #2563eb, #38bdf8, #2563eb);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="relative overflow-hidden w-full rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50 via-sky-100 to-blue-50 px-10 py-12 flex flex-col items-center shadow-[0_8px_32px_rgba(59,130,246,0.08),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full bg-blue-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-sky-300/20 blur-2xl" />

        {/* Cat with glow ring */}
        <div className="relative mb-5">
          <div className="ring-pulse absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.15)_0%,transparent_70%)]" />
          <div>
            <Lottie animationData={catAnimation} loop className="w-40 h-40" />
          </div>
        </div>

        <span
          className="shimmer-text mb-2.5 text-[11px] font-semibold tracking-widest uppercase"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          AI Diagnosis in Progress
        </span>

        <div className="mb-6 h-8 w-full overflow-hidden text-center">
          <p
            key={msgIndex}
            className={`m-0 leading-8 text-[15px] text-blue-500/80 ${visible ? 'msg-in' : 'msg-out'}`}
          >
            {messages[msgIndex]}
          </p>
        </div>

        <div className="mb-5 flex items-center gap-2.5">
          {Array.from({ length: PAW_COUNT }).map((_, i) => (
            <div key={i} className={i % 2 === 0 ? '-rotate-15' : 'rotate-15'}>
              <PawIcon filled={i <= pawIndex} />
            </div>
          ))}
        </div>

        <div className="h-0.75 w-40 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-blue-500 to-sky-300 transition-[width] duration-500 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </>
  )
}

export default PawMedLoader
