import { motion } from 'motion/react'
import { GALLERY } from '@/data/content'

export function Gallery() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container-site">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-10"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            The room
          </span>
        </motion.div>

        <div className="-mx-6 flex snap-x overflow-x-auto px-6 pb-2">
          {GALLERY.map((image, index) => (
            <motion.figure
              key={image.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.08 }}
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
        </div>
      </div>
    </section>
  )
}
