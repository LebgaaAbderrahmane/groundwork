import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { ADDRESS, HOURS } from '@/data/content'
import { Button } from '@/components/ui/button'
import { fadeUp, VIEWPORT } from '@/lib/motion'

export function FindUs() {
  return (
    <section id="find" className="scroll-mt-20 bg-footer py-28 text-footer-foreground md:py-36">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="container-site flex flex-col items-center text-center"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-footer-foreground/60">
          Find us
        </span>
        <h2 className="mt-4 font-display text-4xl font-bold italic leading-tight md:text-6xl">
          Come and Say <em className="not-italic text-accent">Hello</em>
        </h2>

        <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-footer-foreground/80">
          {HOURS}
        </p>
        <p className="mt-1 text-sm font-light text-footer-foreground/60">{ADDRESS}</p>

        <Button asChild size="lg" variant="cream" className="mt-10">
          <a
            href="https://maps.google.com/?q=14+Kingsland+Road,+Dalston,+London+E8"
            target="_blank"
            rel="noreferrer"
          >
            Get directions <ArrowRight className="size-4" aria-hidden />
          </a>
        </Button>
      </motion.div>
    </section>
  )
}
