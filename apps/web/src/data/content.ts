export type NavLink = { label: string; href: string }

export const NAV_LINKS: NavLink[] = [
  { label: 'Menu', href: '/menu' },
  { label: 'Our Coffee', href: '/#coffee' },
  { label: 'About', href: '/#about' },
  { label: 'Find Us', href: '/#find' },
]

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const HERO_IMAGE = unsplash('photo-1554118811-1e0d58224f24', 1600)

export const HERO = {
  label: 'Specialty Coffee · Dalston, London',
  headline: ['Good Coffee.', 'Good People.', 'Great Days.'],
  accentWord: 'Great Days.',
  subtitle:
    'Single-origin espresso, seasonal filter, and everything baked from scratch',
  trust: ['Specialty Roaster', 'Organic Milk', 'Dog Friendly'],
}

export type MenuItem = {
  name: string
  description: string
  price: string
  image: string
  alt: string
}

export const MENU: MenuItem[] = [
  {
    name: 'Espresso Drinks',
    description: 'flat white, cortado, oat latte',
    price: 'from £3.20',
    image: unsplash('photo-1541167760496-1628856ab772'),
    alt: 'Flat white with latte art on a warm wooden table in morning light',
  },
  {
    name: 'Filter Coffee',
    description: 'V60, Chemex, cold brew',
    price: 'from £3.50',
    image: unsplash('photo-1514432324607-a09d9b4aefdd'),
    alt: 'V60 pour over coffee brewing in a ceramic dripper',
  },
  {
    name: 'All-Day Brunch',
    description: 'avocado toast, eggs, granola',
    price: 'from £8',
    image: unsplash('photo-1541519227354-08fa5d50c44d'),
    alt: 'Avocado toast brunch plate on a café table',
  },
  {
    name: 'Baked Goods',
    description: 'croissants, banana bread, seasonal cakes',
    price: 'from £2.80',
    image: unsplash('photo-1555507036-ab1f4038808a'),
    alt: 'Fresh croissants and pastries on a marble counter',
  },
]

export type BrewMethod = {
  name: string
  description: string
  icon: 'espresso' | 'v60' | 'chemex' | 'coldbrew'
}

export const BREW_METHODS: BrewMethod[] = [
  {
    name: 'Espresso',
    description: 'Rich, short and intense',
    icon: 'espresso',
  },
  {
    name: 'V60',
    description: 'Clean, bright and delicate',
    icon: 'v60',
  },
  {
    name: 'Chemex',
    description: 'Bold, smooth and layered',
    icon: 'chemex',
  },
  {
    name: 'Cold Brew',
    description: 'Slow-steeped, sweet and mellow',
    icon: 'coldbrew',
  },
]

export const OUR_COFFEE_IMAGES = {
  large: unsplash('photo-1447933601403-0c6688de566e', 1000),
  small: unsplash('photo-1495474472287-4d71bcdd2085', 700),
}

export const COFFEE_CHIPS = ['Direct Trade', 'Single Origin', 'Seasonal Rotating']

export const ABOUT_IMAGE = unsplash('photo-1509042239860-f550ce710b93', 1000)

export const ABOUT_CHIPS = ['Est. 2019', 'Specialty SCA', 'Community Hub']

export type GalleryImage = { src: string; alt: string }

export const GALLERY: GalleryImage[] = [
  {
    src: unsplash('photo-1553413077-190dd305871c'),
    alt: 'Barista pouring latte art into a ceramic cup',
  },
  {
    src: unsplash('photo-1521017432531-fbd92d768814'),
    alt: 'Two friends chatting over coffee in a cozy corner',
  },
  {
    src: unsplash('photo-1525610553991-2bede1a236e2'),
    alt: 'Independent coffee shop exterior with plants and chalkboard',
  },
  {
    src: unsplash('photo-1498804103079-a6351b050096'),
    alt: 'Barista grinding coffee beans during the morning routine',
  },
  {
    src: unsplash('photo-1517701604599-bb29b565090c'),
    alt: 'Seasonal iced filter coffee served in a glass',
  },
]

export type Testimonial = {
  quote: string
  name: string
  visit: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Best flat white in Dalston, no competition. The banana bread is dangerous.',
    name: '@coffeelover',
    visit: 'Google Review',
  },
  {
    quote: 'The V60 is brewed with such care you can taste the love in every sip.',
    name: '@maya_bakes',
    visit: 'Google Review',
  },
  {
    quote: 'Warmest room in Dalston. Came for a coffee, stayed three hours working.',
    name: '@tom_eats',
    visit: 'Google Review',
  },
]

export const HOURS =
  'Monday–Friday 7am–5pm · Saturday–Sunday 8am–5pm'

export const ADDRESS = '14 Kingsland Road, Dalston, London E8'
