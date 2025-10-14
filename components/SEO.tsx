import Head from 'next/head'
import React from 'react'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  canonical?: string
  children?: React.ReactNode
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://plugcraft.online'
const defaultTitle = 'Plugcraft — Fast, reliable gaming tools'
const defaultDescription = 'Plugcraft (Ghosted) provides high-performance gaming tools and networking utilities. Learn about Plugcraft, lag detection, mitigation, features, and support.'

export default function SEO({ title, description, image, canonical, children }: SEOProps) {
  const metaTitle = title || defaultTitle
  const metaDescription = description || defaultDescription
  const metaImage = image || `${siteUrl}/assets/Ghosted_logo.png`
  const metaUrl = canonical || siteUrl

  return (
    <Head>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content="index,follow" />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:image" content={metaImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      <link rel="canonical" href={metaUrl} />

      {children}
    </Head>
  )
}
