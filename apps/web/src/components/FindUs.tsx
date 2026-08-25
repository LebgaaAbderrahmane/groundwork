import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, MapPin } from 'lucide-react'
import { ADDRESS, FIND_US_IMAGE, HOURS } from '@/data/content'
import { Button } from '@/components/ui/button'
import { fadeUp, revealStagger, VIEWPORT } from '@/lib/motion'

const MAPS_URL =
  'https://maps.google.com/?q=14+Kingsland+Road,+Dalston,+London+E8'

const MAPS_EMBED =
  'https://maps.google.com/maps?q=14%20Kingsland%20Road%2C%20Dalston%2C%20London%20E8&output=embed&z=15'

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
        className="container-site relative z-10 grid items-center gap-12 py-28 lg:grid-cols-2"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-footer-foreground/60">
          Find us
        </span>
        <h2 className="mt-4 font-display text-4xl font-bold italic leading-tight md:text-6xl">
          Come and Say <em className="not-italic text-accent">Hello</em>
        </h2>

        <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-footer-foreground/80">
          {BRAND.hours}
        </p>
        <p className="mt-1 text-sm font-light text-footer-foreground/60">{BRAND.address}</p>

        <Button asChild size="lg" variant="cream" className="mt-10">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(BRAND.address)}`}
            target="_blank"
            rel="noreferrer"
          >
            Get directions <ArrowRight className="size-4" aria-hidden />
          </a>
        </Button>
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/70">
            Find us
          </span>

          <h2 className="mt-4 font-display text-4xl font-bold italic leading-tight text-white md:text-6xl">
            Come and Say <em className="not-italic text-accent">Hello</em>
          </h2>

          <p className="mt-6 max-w-md text-base font-light leading-relaxed text-white/85">
            {HOURS}
          </p>
          <p className="mt-1 text-sm font-light text-white/70">{ADDRESS}</p>

          <div className="mt-10">
            <Button asChild size="lg" variant="cream">
              <a href={MAPS_URL} target="_blank" rel="noreferrer">
                Get directions <ArrowRight className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="w-full overflow-hidden rounded-2xl border border-white/15 bg-black/20 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <span className="flex items-center gap-2 text-xs text-white/85">
              <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
              {ADDRESS}
            </span>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-accent transition-colors hover:text-white"
            >
              Open map ↗
            </a>
          </div>
          <iframe
            src={MAPS_EMBED}
            title="Groundwork Coffee on the map — 14 Kingsland Road, Dalston, London E8"
            loading="lazy"
            allowFullScreen
            className="h-64 w-full lg:h-80"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}