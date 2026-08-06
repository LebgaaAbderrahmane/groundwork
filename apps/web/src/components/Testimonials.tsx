import { motion, type Variants } from 'motion/react'
import { Star } from 'lucide-react'
import { TESTIMONIALS } from '@/data/content'
import { SectionHeading } from '@/components/shared/section-heading'

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

export function Testimonials() {
  return (
    <section className="border-t border-border/60 bg-surface py-24 md:py-32">
      <div className="container-site">
        <SectionHeading
          eyebrow="Word on the street"
          title="What the"
          accent="regulars say"
          align="center"
          className="mx-auto max-w-2xl"
        />

        <motion.div
          variants={list}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-8 md:grid-cols-3"
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.figure
              key={testimonial.name}
              variants={card}
              className="flex flex-col rounded-lg border border-border/70 bg-background p-8"
            >
              <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-accent text-accent" aria-hidden />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 font-display text-xl font-normal italic leading-relaxed text-foreground/85">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-6 flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
                  {testimonial.name}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {testimonial.visit}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
