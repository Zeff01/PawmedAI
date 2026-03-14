import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import catAnimation from '@/assets/pawmed-cat.json'

const messages = [
  'Our AI vet is sniffing out the diagnosis…',
  'Scanning for symptoms and patterns…',
  'Consulting the medical database…',
  'Almost done, good boy is working hard!',
]

function PawMedLoader() {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <Lottie animationData={catAnimation} loop className="w-48 h-48" />

      <div style={{ height: '28px', overflow: 'hidden' }}>
        <p
          key={msgIndex}
          className="text-sm text-center"
          style={{
            color: 'var(--color-text-secondary, #6b7280)',
            animation: 'fadeMsg 2.5s ease-in-out forwards',
            margin: 0,
          }}
        >
          {messages[msgIndex]}
        </p>
      </div>

      <div className="flex gap-2 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#1D9E75',
              animation: `dotPulse 1.2s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%,100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeMsg {
          0% { opacity: 0; transform: translateY(6px); }
          15%, 85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

export default PawMedLoader
