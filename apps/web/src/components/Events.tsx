import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/shared/chip'
import { fadeUp, VIEWPORT } from '@/lib/motion'

export function Events() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="container-site flex flex-col items-center text-center"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Events &amp; space
        </span>
        <h2 className="mt-4 font-display text-4xl font-bold text-foreground md:text-5xl">
          Hire the <em className="italic text-accent">Space</em>
        </h2>

        <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-foreground/70">
          Available for private hire evenings and weekends — coffee cuppings,
          team breakfasts, and popup events.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Chip>Private Hire</Chip>
          <Chip>Coffee Cuppings</Chip>
        </div>

        <Button asChild size="lg" className="mt-10">
          <a href={`mailto:${BRAND.email}`}>
            Enquire about events <ArrowRight className="size-4" aria-hidden />
          </a>
        </Button>
      </motion.div>
    </section>
  )
}
