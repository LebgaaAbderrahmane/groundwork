import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { EASE_EMPHASIZED, VIEWPORT } from '@/lib/motion'

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  accent?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow && (
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
        {title}
        {accent && (
          <>
            {' '}
            <em className="italic text-accent">{accent}</em>
          </>
        )}
      </h2>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.5, ease: EASE_EMPHASIZED }}
        className="h-[3px] w-20 origin-left rounded-full bg-accent"
      />
    </div>
  )
}
