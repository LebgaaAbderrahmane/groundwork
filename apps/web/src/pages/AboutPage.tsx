import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import {
  ABOUT_CHIPS,
  ABOUT_IMAGE,
  ABOUT_TIMELINE,
  ABOUT_VALUES,
  GALLERY,
  PRESS_MENTIONS,
} from '@/data/content'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/shared/chip'
import { SectionHeading } from '@/components/shared/section-heading'
import { fadeUp, fadeUpScale, revealStagger, VIEWPORT } from '@/lib/motion'
import { useDocumentTitle } from '@/lib/hooks'

export default function AboutPage() {
  useDocumentTitle('About')

  return (
    <main className="pt-20">
      <section className="bg-surface py-24 md:py-32">
        <motion.div
          variants={revealStagger(0.14)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="container-site grid items-center gap-16 lg:grid-cols-2"
        >
          <motion.div variants={fadeUp} className="order-2 lg:order-1">
            <SectionHeading eyebrow="Our story" title="Built on a Horse Trailer and a" accent="Big Dream" />

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
            <p className="mt-4 text-base font-light leading-relaxed text-foreground/70">
              What began as a weekend experiment became a gathering place for the
              island — a spot where remote workers plug in, friends catch up, and
              families linger over brunch. We didn't set out to build a community
              hub. The community built it for us.
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

      <section className="bg-background py-24 md:py-32">
        <div className="container-site">
          <SectionHeading eyebrow="What we stand for" title="Our" accent="Values" className="mb-12" />
          <div className="grid gap-8 md:grid-cols-3">
            {ABOUT_VALUES.map((value) => (
              <motion.div
                key={value.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">{value.title}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-foreground/70">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-24 md:py-32">
        <div className="container-site grid items-start gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Timeline" title="The Journey" accent="So Far" className="mb-8" />
            <div className="space-y-6">
              {ABOUT_TIMELINE.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={VIEWPORT}
                  className="flex gap-4"
                >
                  <span className="shrink-0 text-sm font-semibold text-accent">{item.year}</span>
                  <p className="text-sm font-light leading-relaxed text-foreground/70">{item.event}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="Our space" title="The" accent="Room" className="mb-8" />
            <div className="grid grid-cols-2 gap-3">
              {GALLERY.slice(0, 4).map((image) => (
                <div key={image.src} className="overflow-hidden rounded-lg">
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 md:py-28">
        <div className="container-site">
          <SectionHeading eyebrow="As seen in" title="What They" accent="Said" className="mb-12" />
          <div className="grid gap-8 md:grid-cols-3">
            {PRESS_MENTIONS.map((mention) => (
              <motion.div
                key={mention.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT}
                className="flex flex-col rounded-xl border border-border bg-surface p-6"
              >
                <p className="font-display text-base font-normal italic leading-relaxed text-foreground/85">
                  "{mention.quote}"
                </p>
                <span className="mt-4 text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
                  {mention.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-accent/15 py-24 text-center md:py-32">
        <div className="container-site">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Come meet the <em className="italic text-accent">family</em>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-light text-foreground/70">
            We're open seven days a week on Orr's Island. Pull up a chair —
            there's always room for one more.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/find-us">
                Find us <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/menu">
                See the menu <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
