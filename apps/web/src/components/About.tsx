import { motion } from 'motion/react'
import { ABOUT_CHIPS, ABOUT_IMAGE } from '@/data/content'
import { Chip } from '@/components/shared/chip'
import { fadeUp, fadeUpScale, revealStagger, VIEWPORT } from '@/lib/motion'

export function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-surface py-24 md:py-32">
      <motion.div
        variants={revealStagger(0.14)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="container-site grid items-center gap-16 lg:grid-cols-2"
      >
        <motion.div variants={fadeUp} className="order-2 lg:order-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Our story
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
            Opened with One Machine and a <em className="italic text-accent">Big Idea</em>
          </h2>

          <p className="mt-8 text-base font-light leading-relaxed text-foreground/70">
            Groundwork opened in 2019, the day Jamie Walsh — a former accountant
            who'd spent ten years chasing other people's spreadsheets — finally
            quit to build the café he'd always wanted. One espresso machine, one
            barista, and a very long list of coffee books.
          </p>
          <p className="mt-4 text-base font-light leading-relaxed text-foreground/70">
            Today the same machine still runs the bar, but the room is full of
            regulars, first dates and freelancers who've made it their second
            office. We're still small, still independent, and still fussy about
            the coffee.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {ABOUT_CHIPS.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUpScale} className="order-1 overflow-hidden rounded-lg lg:order-2">
          <img
            src={ABOUT_IMAGE}
            alt="Coffee shop founder behind the bar, smiling in a casual apron with a warm café backdrop"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
