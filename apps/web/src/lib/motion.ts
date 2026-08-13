import type { Variants } from 'motion/react'

export const EASE_EMPHASIZED: [number, number, number, number] = [0.05, 0.7, 0.1, 1]
export const EASE_PREMIUM: [number, number, number, number] = [0.4, 0, 0.2, 1]
export const EASE_SNAPPY: [number, number, number, number] = [0.2, 0, 0, 1]

export const DUR = {
  micro: 0.2,
  fast: 0.3,
  reveal: 0.6,
  hero: 0.7,
} as const

export const VIEWPORT = { once: true, margin: '-70px' } as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.reveal, ease: EASE_EMPHASIZED },
  },
}

export const fadeUpScale: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DUR.reveal, ease: EASE_EMPHASIZED },
  },
}

export function revealStagger(stagger = 0.1, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  }
}

export const springMicro = { type: 'spring', stiffness: 500, damping: 22 } as const