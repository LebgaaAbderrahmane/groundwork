import { motion, type Variants } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { HERO, HERO_IMAGE } from '@/data/content'
import { Button } from '@/components/ui/button'

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="relative h-[58vh] min-h-[380px] w-full"
      >
        <img
          src={HERO_IMAGE}
          alt="Warm independent coffee shop interior with wooden tables, Edison bulbs and exposed brick in morning light"
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(to_top,hsl(var(--background))_0%,transparent_45%)]" />
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container-site relative z-10 -mt-24 flex flex-col items-center pb-20 pt-10 text-center"
      >
        <motion.p
          variants={item}
          className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
        >
          {HERO.label}
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-6 whitespace-pre-line font-display text-[clamp(52px,7vw,110px)] font-bold leading-[1.02] tracking-tight text-foreground"
        >
          {HERO.headline[0]}
          {'\n'}
          {HERO.headline[1]}
          {'\n'}
          {HERO.headline[2] === HERO.accentWord ? (
            <em className="italic text-accent">{HERO.accentWord}</em>
          ) : (
            HERO.headline[2]
          )}
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-md text-lg font-light leading-relaxed text-foreground/70"
        >
          {HERO.subtitle}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/menu">
              See our menu <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#find">
              <MapPin className="size-4" aria-hidden /> Find us
            </a>
          </Button>
        </motion.div>

        <motion.ul
          variants={item}
          className="mt-12 flex flex-wrap items-center justify-center gap-2.5"
        >
          {HERO.trust.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-border bg-surface/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/70"
            >
              {chip}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  )
}
