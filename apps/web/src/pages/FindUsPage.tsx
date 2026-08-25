import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, Clock, Dog, MapPin, ParkingSquare, Train, Accessibility } from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import { FIND_US_IMAGE, FIND_US_DETAILS, HIRE_INFO } from '@/data/content'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/shared/chip'
import { SectionHeading } from '@/components/shared/section-heading'
import { fadeUp, VIEWPORT } from '@/lib/motion'
import { useDocumentTitle } from '@/lib/hooks'

const MAPS_URL = `https://maps.google.com/?q=${encodeURIComponent(BRAND.address)}`
const MAPS_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(BRAND.address)}&output=embed&z=15`

const GETTING_HERE = [
  { icon: ParkingSquare, label: 'Parking', detail: FIND_US_DETAILS.parking },
  { icon: Accessibility, label: 'Accessibility', detail: FIND_US_DETAILS.accessibility },
  { icon: Dog, label: 'Pets', detail: FIND_US_DETAILS.pets },
  { icon: Train, label: 'Getting here', detail: FIND_US_DETAILS.transit },
]

export function FindUsPage() {
  useDocumentTitle('Find Us')

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1.12, 1.02])

  return (
    <main className="pt-16">
      <section ref={heroRef} className="relative flex min-h-[50svh] items-center overflow-hidden">
        <motion.div style={{ y: parallaxY, scale: parallaxScale }} className="absolute inset-0">
          <img
            src={FIND_US_IMAGE}
            alt={`${BRAND.name} exterior with plants and chalkboard`}
            loading="eager"
            className="h-full w-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.25)_45%,rgba(0,0,0,0.7)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />

        <div className="container-site relative z-10 py-24 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/70"
          >
            Visit us
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 font-display text-5xl font-bold italic text-white md:text-7xl"
          >
            Come and Say <em className="not-italic text-accent">Hello</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mt-6 max-w-md text-base font-light text-white/85"
          >
            {BRAND.hours}
          </motion.p>
        </div>
      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container-site grid gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Details" title="Hours &" accent="Location" className="mb-8" />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.6} aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">Opening hours</p>
                  <p className="mt-1 text-sm font-light text-foreground/70">{BRAND.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.6} aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">Address</p>
                  <p className="mt-1 text-sm font-light text-foreground/70">{BRAND.address}</p>
                </div>
              </div>
            </div>
            <div className="mt-10">
              <Button asChild size="lg">
                <a href={MAPS_URL} target="_blank" rel="noreferrer">
                  Get directions <ArrowRight className="size-4" aria-hidden />
                </a>
              </Button>
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="On the map" title="Find" accent="Us" className="mb-8" />
            <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
              <iframe
                src={MAPS_EMBED}
                title={`${BRAND.name} on the map — ${BRAND.address}`}
                loading="lazy"
                allowFullScreen
                className="h-80 w-full lg:h-96"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-24 md:py-32">
        <div className="container-site">
          <SectionHeading eyebrow="Getting here" title="Good to" accent="Know" className="mb-12" />
          <div className="grid gap-8 md:grid-cols-2">
            {GETTING_HERE.map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={VIEWPORT}
                  className="flex gap-4 rounded-xl border border-border bg-background p-6"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                    <Icon className="size-5 text-accent" strokeWidth={1.6} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-light leading-relaxed text-foreground/70">{item.detail}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container-site grid items-start gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Events" title={HIRE_INFO.title} className="mb-8" />
            {HIRE_INFO.paragraphs.map((p, i) => (
              <p key={i} className="text-base font-light leading-relaxed text-foreground/70">
                {p}
              </p>
            ))}
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Chip>Private Hire</Chip>
              <Chip>Coffee Cuppings</Chip>
              <Chip>Team Breakfasts</Chip>
              <Chip>Popup Events</Chip>
            </div>
            <div className="mt-10">
              <Button asChild size="lg">
                <a href={`mailto:${HIRE_INFO.email}`}>
                  Enquire about events <ArrowRight className="size-4" aria-hidden />
                </a>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground">Quick Facts</h3>
            <div className="mt-6 space-y-4 text-left">
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-sm text-foreground/70">Seated capacity</span>
                <span className="text-sm font-medium text-foreground">30 guests</span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-sm text-foreground/70">Standing capacity</span>
                <span className="text-sm font-medium text-foreground">50 guests</span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-sm text-foreground/70">Availability</span>
                <span className="text-sm font-medium text-foreground">Evenings & weekends</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-foreground/70">Included</span>
                <span className="text-sm font-medium text-foreground">Setup, coffee, cleanup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-accent/15 py-24 text-center md:py-32">
        <div className="container-site">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            We'd love to <em className="italic text-accent">see you</em>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-light text-foreground/70">
            Pull up a stool, grab a window seat, or order ahead and skip the wait.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/menu">
                Order ahead <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
