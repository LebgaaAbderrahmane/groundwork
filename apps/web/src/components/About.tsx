import { motion } from 'motion/react'
import { BRAND } from '@cribstone/shared'
import { ABOUT_CHIPS, ABOUT_IMAGE } from '@/data/content'
import { Chip } from '@/components/shared/chip'

export function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-surface py-24 md:py-32">
      <div className="container-site grid items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="order-2 lg:order-1"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Our story
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
            Built on a Horse Trailer and a <em className="italic text-accent">Big Dream</em>
          </h2>

          <p className="mt-8 text-base font-light leading-relaxed text-foreground/70">
            {BRAND.name} started as a converted horse trailer on Orr's Island —
            {BRAND.founder} and his two kids, Quinn and Julia, serving espresso
            from a parking lot with nothing but a dream and a Bard Coffee
            subscription. The locals kept coming back. They brought friends.
          </p>
          <p className="mt-4 text-base font-light leading-relaxed text-foreground/70">
            Today we've traded the trailer for a proper counter, but the mission
            hasn't changed: great beans, honest drinks, and a room where
            everyone knows your name — or will by the time your cup is empty.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {ABOUT_CHIPS.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="order-1 overflow-hidden rounded-lg lg:order-2"
        >
          <img
            src={ABOUT_IMAGE}
            alt="Coffee shop founder behind the bar, smiling in a casual apron with a warm café backdrop"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  )
}
