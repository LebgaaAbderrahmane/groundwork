import { motion } from 'motion/react'
import { Coffee, CupSoda, Droplets, FlaskConical, type LucideIcon } from 'lucide-react'
import { BREW_METHODS } from '@/data/content'
import { fadeUp, revealStagger, VIEWPORT } from '@/lib/motion'

const ICONS: Record<string, LucideIcon> = {
  espresso: Coffee,
  v60: Droplets,
  chemex: FlaskConical,
  coldbrew: CupSoda,
}

export function BrewMethods() {
  return (
    <section className="bg-accent/15">
      <motion.div
        variants={revealStagger(0.09)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="container-site grid grid-cols-2 gap-x-6 gap-y-12 py-16 md:grid-cols-4 md:py-20"
      >
        {BREW_METHODS.map((method) => {
          const Icon = ICONS[method.icon]
          return (
            <motion.div
              key={method.name}
              variants={fadeUp}
              className="group flex flex-col items-center gap-3 text-center"
            >
              <span className="flex size-16 items-center justify-center rounded-full border border-accent/30 bg-background/60 transition-transform duration-200 ease-out group-hover:scale-105">
                <Icon className="size-7 text-accent transition-transform duration-200 ease-out group-hover:-rotate-12" strokeWidth={1.6} aria-hidden />
              </span>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
                {method.name}
              </p>
              <p className="font-display text-sm italic text-foreground/70">
                {method.description}
              </p>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
