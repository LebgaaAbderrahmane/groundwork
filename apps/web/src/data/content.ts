import { BRAND } from '@cribstone/shared'

export type NavLink = { label: string; href: string }

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menu' },
  { label: 'Our Coffee', href: '/our-coffee' },
  { label: 'About', href: '/about' },
  { label: 'Find Us', href: '/find-us' },
]

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

export const HERO_IMAGE = unsplash('photo-1554118811-1e0d58224f24', 1600)

export const HERO = {
  label: BRAND.tagline,
  headline: ['Good Coffee.', 'Good People.', 'Great Days.'],
  accentWord: 'Great Days.',
  subtitle: BRAND.subtitle,
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
    price: 'from $3.20',
    image: unsplash('photo-1541167760496-1628856ab772'),
    alt: 'Flat white with latte art on a warm wooden table in morning light',
  },
  {
    name: 'Filter Coffee',
    description: 'V60, Chemex, cold brew',
    price: 'from $3.50',
    image: unsplash('photo-1514432324607-a09d9b4aefdd'),
    alt: 'V60 pour over coffee brewing in a ceramic dripper',
  },
  {
    name: 'All-Day Brunch',
    description: 'avocado toast, eggs, granola',
    price: 'from $8',
    image: unsplash('photo-1541519227354-08fa5d50c44d'),
    alt: 'Avocado toast brunch plate on a café table',
  },
  {
    name: 'Baked Goods',
    description: 'croissants, banana bread, seasonal cakes',
    price: 'from $2.80',
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

export const COFFEE_ORIGIN = [
  {
    region: 'Ethiopia Yirgacheffe',
    notes: 'Bright citrus, jasmine florals, clean finish',
    altitude: '1,800–2,200m',
  },
  {
    region: 'Colombia Huila',
    notes: 'Caramel sweetness, red apple, balanced acidity',
    altitude: '1,500–1,900m',
  },
  {
    region: 'Guatemala Antigua',
    notes: 'Dark chocolate, toasted almond, smoky body',
    altitude: '1,500–1,700m',
  },
]

export const COFFEE_PROCESS = {
  title: 'How We Roast',
  paragraphs: [
    'Every batch is roasted on a vintage Probat UG-22 in East London — a small drum roaster that gives us precise control over first crack development. We keep profiles light to medium, preserving the origin character rather than burying it under roast.',
    'We roast once a week, on Tuesdays. Orders ship within 48 hours so you always get coffee at its peak — between 7 and 21 days off roast, when the flavours are most vivid.',
  ],
}

export const ABOUT_IMAGE = unsplash('photo-1509042239860-f550ce710b93', 1000)

export const ABOUT_CHIPS = ['Est. 2025', 'Family-Run', 'Community Hub']

export const ABOUT_TIMELINE = [
  { year: '2025', event: 'Converted a horse trailer into a mobile coffee cart on Orr\'s Island' },
  { year: '2025', event: 'First permanent location opens on Harpswell Islands Road' },
  { year: '2026', event: 'Added full brunch menu and in-house bakery' },
  { year: '2026', event: 'Launched wholesale partnerships with local restaurants' },
]

export const ABOUT_VALUES = [
  {
    title: 'Honest Drinks',
    description: 'No syrups, no shortcuts. Just good beans, good milk, and people who care about the pour.',
  },
  {
    title: 'Community First',
    description: 'We host book clubs, neighbourhood meetings, and anything that brings people together over a cup.',
  },
  {
    title: 'Sustainable by Default',
    description: 'Compostable cups, oat milk as default, and a bean bag return programme that actually works.',
  },
]

export type GalleryImage = { src: string; alt: string }

export const FIND_US_IMAGE = unsplash('photo-1525610553991-2bede1a236e2', 1600)

export const FIND_US_DETAILS = {
  parking: 'Free street parking along Harpswell Islands Road. Small gravel lot behind the shop.',
  accessibility: 'Ground-floor entrance, wide doorway, accessible restroom available.',
  pets: 'Dogs welcome on the patio. Water bowls provided.',
  transit: 'Island trolley runs seasonal loops past the shop. Bicycle rack at the entrance.',
}

export const HIRE_INFO = {
  title: 'Hire the Space',
  paragraphs: [
    'Our shop transforms into a private venue on evenings and weekends. Whether it\'s a coffee cupping for your team, a birthday brunch, or a popup market — we\'ll set the stage, you bring the people.',
    'Capacity for seated events is 30, standing up to 50. We handle setup, coffee service, and cleanup so you can focus on your guests.',
  ],
  email: BRAND.email,
}

export type FAQItem = { question: string; answer: string }

export const FAQ: FAQItem[] = [
  {
    question: 'Is there Wi-Fi?',
    answer: 'Yes — free, fast, and reliable. We know you need it for the long stay.',
  },
  {
    question: 'Do you take reservations?',
    answer: 'Walk-ins only for daily service. For private hire and events, get in touch via email and we\'ll sort you out.',
  },
  {
    question: 'Where can I park?',
    answer: 'Free street parking runs along Harpswell Islands Road. There\'s also a small gravel lot behind the shop.',
  },
  {
    question: 'Is the shop dog-friendly?',
    answer: 'Absolutely. Dogs are welcome on the patio with water bowls provided. We\'ll even have a treat behind the counter.',
  },
  {
    question: 'Do you sell beans to take home?',
    answer: 'We do — 250g bags of our house blend and seasonal single origins. Ask at the counter or order online.',
  },
  {
    question: 'Are there dairy-free options?',
    answer: 'Oat milk is our default and it\'s included at no extra charge. We also carry soy and almond milk.',
  },
]

export const PRESS_MENTIONS = [
  { name: 'Maine Food & Drink', quote: 'Orr\'s Island\'s best-kept secret — for now.' },
  { name: 'Portland Press Herald', quote: 'A horse trailer turned into the island\'s favourite gathering spot.' },
  { name: 'Bon Appétit', quote: 'Proof that great coffee doesn\'t need a city postcode.' },
]

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
  {
    src: unsplash('photo-1442512595331-e89e73853f31'),
    alt: 'Fresh pastries and croissants displayed on a wooden board',
  },
  {
    src: unsplash('photo-1495474472287-4d71bcdd2085'),
    alt: 'Latte art in a warm-lit café setting',
  },
  {
    src: unsplash('photo-1501339847302-ac426a4a7cbb'),
    alt: 'Barista tamping espresso with focus and precision',
  },
]

export type Testimonial = {
  quote: string
  name: string
  visit: string
  rating: number
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Best flat white on the island, no competition. The banana bread is dangerous.',
    name: '@coffeelover',
    visit: 'Google Review',
    rating: 5,
  },
  {
    quote: 'The V60 is brewed with such care you can taste the love in every sip.',
    name: '@maya_bakes',
    visit: 'Google Review',
    rating: 5,
  },
  {
    quote: 'Warmest room on Orr\'s Island. Came for a coffee, stayed three hours working.',
    name: '@tom_eats',
    visit: 'Google Review',
    rating: 5,
  },
  {
    quote: 'The avocado toast alone is worth the ferry. Generous portions, brilliant coffee.',
    name: '@sarah.cooks',
    visit: 'Yelp',
    rating: 4,
  },
  {
    quote: 'Finally, proper specialty coffee on the island. The cold brew is unreal in summer.',
    name: '@daveontheroad',
    visit: 'TripAdvisor',
    rating: 5,
  },
  {
    quote: 'Bring your dog, grab a window seat, order the cortado. That\'s it. That\'s the review.',
    name: '@pawsandbeans',
    visit: 'Google Review',
    rating: 5,
  },
]

export const HOURS = BRAND.hours

export const ADDRESS = BRAND.address
