import { motion } from 'motion/react'
import { GALLERY } from '@/data/content'
import { fadeUp, revealStagger, VIEWPORT } from '@/lib/motion'

export function Gallery() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container-site">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="mb-10"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            The room
          </span>
        </motion.div>

        <motion.div
          variants={revealStagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="-mx-6 flex snap-x overflow-x-auto px-6 pb-2"
        >
          {GALLERY.map((image) => (
            <motion.figure
              key={image.src}
              variants={fadeUp}
              className="group relative h-[280px] min-w-[78%] shrink-0 snap-start overflow-hidden sm:min-w-[45%] lg:min-w-[19.5%] lg:flex-1"
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.05]"
              />
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}