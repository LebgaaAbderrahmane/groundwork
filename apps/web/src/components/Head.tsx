import { Helmet } from 'react-helmet-async'
import { BRAND } from '@cribstone/shared'

type HeadProps = {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
}

export function Head({
  title,
  description = `${BRAND.name} — ${BRAND.subtitle}`,
  path = '/',
  image = BRAND.logo,
  type = 'website',
}: HeadProps) {
  const fullTitle = title ? `${title} | ${BRAND.name}` : `${BRAND.name} · ${BRAND.tagline}`
  const canonical = `${BRAND.url}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={BRAND.name} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
