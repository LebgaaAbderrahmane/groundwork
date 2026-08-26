import { Hero } from '@/components/Hero'
import { MenuHighlights } from '@/components/MenuHighlights'
import { BrewMethods } from '@/components/BrewMethods'
import { OurCoffee } from '@/components/OurCoffee'
import { About } from '@/components/About'
import { Gallery } from '@/components/Gallery'
import { Events } from '@/components/Events'
import { Testimonials } from '@/components/Testimonials'
import { FindUs } from '@/components/FindUs'
import { Head } from '@/components/Head'
import { JsonLd } from '@/components/JsonLd'
import { BRAND } from '@cribstone/shared'
import { useDocumentTitle } from '@/lib/hooks'

export default function HomePage() {
  useDocumentTitle('Home')
  return (
    <>
      <Head path="/" />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CafeOrCoffeeShop',
          name: BRAND.name,
          url: BRAND.url,
          logo: BRAND.logo,
          description: 'Specialty coffee, fresh-baked goods and community spirit on Orr\'s Island, Maine.',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '1845 Harpswell Islands Road',
            addressLocality: 'Orr\'s Island',
            addressRegion: 'ME',
            postalCode: '04066',
            addressCountry: 'US',
          },
          telephone: BRAND.phone,
          email: BRAND.email,
          openingHours: ['Mo-Fr 07:00-17:00', 'Sa-Su 08:00-17:00'],
          geo: { '@type': 'GeoCoordinates', latitude: BRAND.geo.lat, longitude: BRAND.geo.lng },
          sameAs: [BRAND.social.instagram, BRAND.social.facebook],
        }}
      />
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
