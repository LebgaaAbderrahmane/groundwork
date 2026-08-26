import { Hero } from '@/components/Hero'
import { MenuHighlights } from '@/components/MenuHighlights'
import { BrewMethods } from '@/components/BrewMethods'
import { OurCoffee } from '@/components/OurCoffee'
import { About } from '@/components/About'
import { Gallery } from '@/components/Gallery'
import { Events } from '@/components/Events'
import { Testimonials } from '@/components/Testimonials'
import { FindUs } from '@/components/FindUs'

export default function HomePage() {
  return (
    <>
      <Hero />
      <MenuHighlights />
      <BrewMethods />
      <OurCoffee />
      <About />
      <Gallery />
      <Events />
      <Testimonials />
      <FindUs />
    </>
  )
}
