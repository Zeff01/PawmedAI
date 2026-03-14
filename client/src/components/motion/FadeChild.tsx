import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface FadeChildProps {
  children: ReactNode
  direction?: Direction
  distance?: number
  duration?: number
  className?: string
}

export function FadeChild({
  children,
  direction = 'up',
  distance = 24,
  duration = 0.6,
  className,
}: FadeChildProps) {
  const hidden = (() => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: distance }
      case 'down':
        return { opacity: 0, y: -distance }
      case 'left':
        return { opacity: 0, x: distance }
      case 'right':
        return { opacity: 0, x: -distance }
      case 'none':
        return { opacity: 0 }
    }
  })()

  const show = (() => {
    switch (direction) {
      case 'up':
      case 'down':
        return { opacity: 1, y: 0 }
      case 'left':
      case 'right':
        return { opacity: 1, x: 0 }
      case 'none':
        return { opacity: 1 }
    }
  })()

  return (
    <motion.div
      variants={{
        hidden,
        show: { ...show, transition: { duration, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
