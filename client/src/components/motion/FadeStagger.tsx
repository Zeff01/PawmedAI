import { motion } from 'motion/react'
import type { ReactNode, HTMLAttributes } from 'react'

interface FadeStaggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  staggerDelay?: number
  once?: boolean
  amount?: number
  className?: string
  trigger?: 'mount' | 'scroll'
}

export function FadeStagger({
  children,
  staggerDelay = 0.1,
  once = true,
  amount = 0.1,
  className,
  trigger = 'scroll',
  ...rest
}: FadeStaggerProps) {
  const variants = {
    hidden: {},
    show: { transition: { staggerChildren: staggerDelay } },
  }

  if (trigger === 'mount') {
    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="show"
        className={className}
        {...rest}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
