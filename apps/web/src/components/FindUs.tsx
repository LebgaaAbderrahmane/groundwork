import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { ADDRESS, FIND_US_IMAGE, HOURS } from '@/data/content'
import { Button } from '@/components/ui/button'
import { fadeUp, revealStagger, VIEWPORT } from '@/lib/motion'

export function FindUs() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1.12, 1.02])

  return (
    <section
      ref={sectionRef}
      id="find"
      className="relative flex min-h-[70svh] scroll-mt-20 items-center overflow-hidden bg-footer"
    >
      <motion.div style={{ y: parallaxY, scale: parallaxScale }} className="absolute inset-0">
        <img
          src={FIND_US_IMAGE}
          alt="Independent coffee shop exterior with plants and chalkboard on a London street"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.25)_45%,rgba(0,0,0,0.7)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

      <motion.div
        variants={revealStagger(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="container-site relative z-10 flex flex-col items-center py-28 text-center"
      >
        <motion.span
          variants={fadeUp}
          className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/70"
        >
          Find us
        </motion.span>

        <motion.h2
          variants={fadeUp}
          className="mt-4 font-display text-4xl font-bold italic leading-tight text-white md:text-6xl"
        >
          Come and Say <em className="not-italic text-accent">Hello</em>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-base font-light leading-relaxed text-white/85"
        >
          {HOURS}
        </motion.p>
        <motion.p variants={fadeUp} className="mt-1 text-sm font-light text-white/70">
          {ADDRESS}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10">
          <Button asChild size="lg" variant="cream">
            <a
              href="https://maps.google.com/?q=14+Kingsland+Road,+Dalston,+London+E8"
              target="_blank"
              rel="noreferrer"
            >
              Get directions <ArrowRight className="size-4" aria-hidden />
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}