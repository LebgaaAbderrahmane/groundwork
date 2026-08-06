import { motion } from 'motion/react'
import { Coffee, CupSoda, Droplets, FlaskConical, type LucideIcon } from 'lucide-react'
import { BREW_METHODS } from '@/data/content'

const ICONS: Record<string, LucideIcon> = {
  espresso: Coffee,
  v60: Droplets,
  chemex: FlaskConical,
  coldbrew: CupSoda,
}

export function BrewMethods() {
  return (
    <section className="bg-accent/15">
      <div className="container-site grid grid-cols-2 gap-x-6 gap-y-12 py-16 md:grid-cols-4 md:py-20">
        {BREW_METHODS.map((method, index) => {
          const Icon = ICONS[method.icon]
          return (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                delay: index * 0.1,
              }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <span className="flex size-16 items-center justify-center rounded-full border border-accent/30 bg-background/60">
                <Icon className="size-7 text-accent" strokeWidth={1.6} aria-hidden />
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
      </div>
    </section>
  )
}
