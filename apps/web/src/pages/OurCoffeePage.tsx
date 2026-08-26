import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Coffee, CupSoda, Droplets, FlaskConical, type LucideIcon } from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import {
  BREW_METHODS,
  COFFEE_CHIPS,
  COFFEE_ORIGIN,
  COFFEE_PROCESS,
  OUR_COFFEE_IMAGES,
} from '@/data/content'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/shared/chip'
import { SectionHeading } from '@/components/shared/section-heading'
import { fadeUp, fadeUpScale, revealStagger, VIEWPORT } from '@/lib/motion'
import { useDocumentTitle } from '@/lib/hooks'
import { Head } from '@/components/Head'

const ICONS: Record<string, LucideIcon> = {
  espresso: Coffee,
  v60: Droplets,
  chemex: FlaskConical,
  coldbrew: CupSoda,
}

export default function OurCoffeePage() {
  useDocumentTitle('Our Coffee')

  return (
    <main className="pt-20">
      <Head title="Our Coffee" description="Discover single-origin coffee sourced from trusted farms and roasted in small batches at Cribstone Coffee." path="/our-coffee" />
      <section className="bg-background py-24 md:py-32">
        <motion.div
          variants={revealStagger(0.14)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="container-site grid items-center gap-16 lg:grid-cols-2"
        >
          <motion.div variants={fadeUp}>
            <SectionHeading eyebrow="Our coffee" title="From Farm to" accent="Cup" />

            <blockquote className="mt-8 border-l-2 border-accent/50 pl-6 font-display text-2xl font-light italic leading-snug text-foreground/80">
              "Every bag tells the story of the farmer who grew it."
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

      <section className="bg-surface py-24 md:py-32">
        <div className="container-site">
          <SectionHeading eyebrow="Current origins" title="What's in the" accent="Grinder" className="mb-12" />
          <div className="grid gap-8 md:grid-cols-3">
            {COFFEE_ORIGIN.map((origin) => (
              <motion.div
                key={origin.region}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT}
                className="rounded-xl border border-border bg-background p-6"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">{origin.region}</h3>
                <p className="mt-2 text-sm font-light text-foreground/70">{origin.notes}</p>
                <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Altitude: {origin.altitude}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container-site grid items-start gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Process" title={COFFEE_PROCESS.title} className="mb-8" />
            {COFFEE_PROCESS.paragraphs.map((p, i) => (
              <p key={i} className="text-base font-light leading-relaxed text-foreground/70">
                {p}
              </p>
            ))}
          </div>
          <div>
            <SectionHeading eyebrow="Brewing" title="Our Methods" accent="" className="mb-8" />
            <div className="grid grid-cols-2 gap-6">
              {BREW_METHODS.map((method) => {
                const Icon = ICONS[method.icon]
                return (
                  <div key={method.name} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-6 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full border border-accent/30 bg-background/60">
                      <Icon className="size-6 text-accent" strokeWidth={1.6} aria-hidden />
                    </span>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary">{method.name}</p>
                    <p className="text-sm italic text-foreground/70">{method.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-accent/15 py-24 text-center md:py-32">
        <div className="container-site">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Ready to taste the <em className="italic text-accent">difference</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-light text-foreground/70">
            Every cup at {BRAND.name} is made with beans roasted within the week.
            Come in or order ahead.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/menu">
                Order ahead <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/find-us">
                Visit us <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
