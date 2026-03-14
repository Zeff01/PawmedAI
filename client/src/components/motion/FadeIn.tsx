import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface FadeInProps {
  children: ReactNode
  direction?: Direction
  duration?: number
  delay?: number
  distance?: number
  once?: boolean
  amount?: number
  className?: string
  /** Use 'visible' for mount-based animation, 'whileInView' for scroll-triggered */
  trigger?: 'mount' | 'scroll'
}

const getInitial = (direction: Direction, distance: number) => {
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
}

const getAnimate = (direction: Direction) => {
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
}

export function FadeIn({
  children,
  direction = 'up',
  duration = 0.6,
  delay = 0,
  distance = 24,
  once = true,
  amount = 0.15,
  className,
  trigger = 'scroll',
}: FadeInProps) {
  const initial = getInitial(direction, distance)
  const animate = getAnimate(direction)
  const transition = {
    duration,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  }

  if (trigger === 'mount') {
    return (
      <motion.div
        initial={initial}
        animate={animate}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once, amount }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  )
}
