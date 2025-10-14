import '../styles/globals.css'
import type { AppProps } from 'next/app'
import type { NextPage } from 'next'
import Head from 'next/head'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

type NextPageWithLayout = NextPage & {
  usePlainLayout?: boolean
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://plugcraft.online'
  const siteTitle = 'Plugcraft — Fast, reliable gaming tools'
  const siteDescription =
    'Plugcraft (Ghosted) provides high-performance gaming tools and networking utilities. Learn about Plugcraft, lag switch mitigation, features, and support.'
  const content = Component.usePlainLayout ? (
    <Component {...pageProps} />
  ) : (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={siteDescription} />
        <meta name="keywords" content="Plugcraft, Ghosted, lag switch, gaming tools, ping, lag, plugin" />
        <meta name="theme-color" content="#0f172a" />

        {/* Favicons & webmanifest - prefer specific size files in /public/assets */}
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
        <link rel="mask-icon" href="/assets/mask-icon.svg" color="#111827" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Open Graph / Social */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Plugcraft" />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}/assets/Ghosted_logo.png`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={`${siteUrl}/assets/Ghosted_logo.png`} />

        {/* Canonical (default) - pages can override */}
        <link rel="canonical" href={siteUrl} />

        {/* JSON-LD Organization and WebSite structured data so search engines can associate logo */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Plugcraft',
              url: siteUrl,
              logo: `${siteUrl}/assets/Ghosted_logo.png`,
            }),
          }}
        />
      </Head>

      <SessionContextProvider supabaseClient={supabase}>
        {content}
      {/* Hidden SVG for liquid glass distortion filter */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <defs>
          <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </SessionContextProvider>
      </>
    )
  }
