import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { COFFEE_CHIPS, OUR_COFFEE_IMAGES } from '@/data/content'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/shared/chip'
import { fadeUp, fadeUpScale, revealStagger, VIEWPORT } from '@/lib/motion'

export function OurCoffee() {
  return (
    <section id="coffee" className="scroll-mt-20 bg-background py-24 md:py-32">
      <motion.div
        variants={revealStagger(0.14)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="container-site grid items-center gap-16 lg:grid-cols-2"
      >
        <motion.div variants={fadeUp}>
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Our coffee
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-foreground md:text-5xl">
            From Farm to <em className="italic text-accent">Cup</em>
          </h2>

          <blockquote className="mt-8 border-l-2 border-accent/50 pl-6 font-display text-2xl font-light italic leading-snug text-foreground/80">
            “Every bag tells the story of the farmer who grew it.”
          </blockquote>

          <p className="mt-8 text-base font-light leading-relaxed text-foreground/70">
            We source our beans directly from farms we've visited and trust —
            buying single-origin lots at above fair-trade prices, so the people
            who grow our coffee get paid properly for it. Three rotating
            seasonal origins keep the menu interesting all year round.
          </p>
          <p className="mt-4 text-base font-light leading-relaxed text-foreground/70">
            Everything is roasted in small batches in East London, no more than
            a week before it hits the bar. What you taste in your cup is exactly
            how the farmer intended it.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {COFFEE_CHIPS.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </div>

          <Button asChild variant="outline" size="lg" className="mt-10">
            <a href="#order">
              Shop our beans <ArrowRight className="size-4" aria-hidden />
            </a>
          </Button>
        </motion.div>

        <motion.div variants={fadeUpScale} className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="overflow-hidden rounded-lg">
            <img
              src={OUR_COFFEE_IMAGES.large}
              alt="Freshly roasted coffee beans pouring from a burlap sack in warm studio light"
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-8 -left-8 hidden w-2/5 overflow-hidden rounded-lg border-[6px] border-background shadow-xl sm:block">
            <img
              src={OUR_COFFEE_IMAGES.small}
              alt="A freshly brewed coffee cup in warm café light"
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
