import { motion, type Variants } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { MENU } from '@/data/content'
import { SectionHeading } from '@/components/shared/section-heading'
import { Button } from '@/components/ui/button'

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

export function MenuHighlights() {
  return (
    <section id="menu" className="scroll-mt-20 bg-surface py-24 md:py-32">
      <div className="container-site">
        <SectionHeading eyebrow="From our kitchen" title="What's" accent="On" />

        <motion.div
          variants={list}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-8 md:grid-cols-2"
        >
          {MENU.map((item) => (
            <motion.article
              key={item.name}
              variants={card}
              className="group overflow-hidden rounded-lg border border-border/70 bg-background transition-colors duration-200 ease-out hover:border-primary"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex items-start justify-between gap-6 px-7 py-6">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-foreground">
                    {item.name}
                  </h3>
                  <p className="mt-1.5 text-sm font-light text-foreground/60">
                    {item.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-accent/15 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
                  {item.price}
                </span>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-12 flex justify-center">
          <Button asChild size="lg">
            <Link to="/menu">
              See the full menu <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
