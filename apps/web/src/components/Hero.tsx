import { useRef } from 'react'
import { motion, useScroll, useTransform, type Variants } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { HERO, HERO_IMAGE } from '@/data/content'
import { Button } from '@/components/ui/button'
import { EASE_EMPHASIZED, fadeUp, revealStagger } from '@/lib/motion'

const headlineLine: Variants = {
  hidden: { y: '110%' },
  show: {
    y: '0%',
    transition: { duration: 0.7, ease: EASE_EMPHASIZED },
  },
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1.12, 1.02])

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-background"
    >
      <motion.div
        style={{ y: parallaxY, scale: parallaxScale }}
        className="absolute inset-0"
      >
        <img
          src={HERO_IMAGE}
          alt="Warm independent coffee shop interior with wooden tables, Edison bulbs and exposed brick in morning light"
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.25)_45%,rgba(0,0,0,0.7)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

      <motion.div
        variants={revealStagger(0.12, 0.15)}
        initial="hidden"
        animate="show"
        className="container-site relative z-10 flex flex-col items-center py-28 pt-36 text-center"
      >
        <motion.p variants={fadeUp} className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/75">
          {HERO.label}
        </motion.p>

        <h1 className="mt-6 font-display text-[clamp(48px,7vw,104px)] font-bold leading-[1.05] tracking-tight text-white">
          {HERO.headline.map((line) => (
            <span key={line} className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
              <motion.span variants={headlineLine} className="block">
                {line === HERO.accentWord ? (
                  <em className="italic text-accent">{line}</em>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p variants={fadeUp} className="mt-6 max-w-md text-lg font-light leading-relaxed text-white/85">
          {HERO.subtitle}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/menu">
              Order ahead <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:border-white/60 hover:bg-white/10 hover:text-white"
          >
            <a href="#find">
              <MapPin className="size-4" aria-hidden /> Find us
            </a>
          </Button>
        </motion.div>

        <motion.ul
          variants={fadeUp}
          className="mt-12 flex flex-wrap items-center justify-center gap-2.5"
        >
          {HERO.trust.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/85"
            >
              {chip}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/70">
          Scroll
        </span>
        <motion.span
          className="block h-9 w-px origin-top bg-white/70"
          animate={{ scaleY: [0, 1, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      </motion.div>
    </section>
  )
}