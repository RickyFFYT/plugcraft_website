import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@supabase/auth-helpers-react'
import SEO from '../components/SEO'
import Card3DRotate from '../components/Card3DRotate'
import LogoLockup from '../components/LogoLockup'
// Use public assets for logos
const ASSET_VERSION = 'v2'
const GhostedLogo = `/assets/Ghosted_logo.png?${ASSET_VERSION}`
// Only use GhostedLogo for hero lockup. Remove SoftwareLogo and DracarynLogo from hero.
import bg from '../assets/background.png'

const features = [
  {
    title: 'Plug & Play Simplicity',
    description: 'Ghosted is a lagswitch software with a beautiful UI, designed for gamers by gamers. No setup headaches—just install and play.',
  },
  {
    title: 'Competitive Edge',
    description: 'Gain the upper hand with real-time control and seamless integration. Ghosted is trusted by top gaming communities.',
  },
  {
    title: 'Safe & Secure',
    description: 'Every download is protected, usage is tracked, and your experience is private. Dracaryn Studio stands behind every build.',
  },
]

const workflow = [
  {
    step: 'Sign up & verify',
    detail: 'Create your Ghosted account in seconds. Email verification keeps your license secure and exclusive.',
  },
  {
    step: 'Download & play',
    detail: 'Access the latest Ghosted build instantly. Plug in, launch your game, and activate your lagswitch with a click.',
  },
  {
    step: 'Monitor usage',
    detail: 'Your dashboard shows quota, history, and lets you manage your Ghosted experience with total transparency.',
  },
]

const faqs = [
  {
    q: 'What is Ghosted?',
    a: 'Ghosted is a premium lagswitch software designed for competitive gamers. It offers plug-and-play simplicity, a beautiful modern UI, and real-time network control with zero detection.',
  },
  {
    q: 'How do I install and use Ghosted?',
    a: 'After signing up and verifying your email, download Ghosted from your dashboard. Extract the files, run the installer, and launch the application. Watch our video tutorial below for a complete walkthrough of installation and usage.',
  },
  {
    q: 'What are the system requirements?',
    a: 'Ghosted works on Windows 10/11 (64-bit). You need administrator privileges for installation. No special hardware requirements - it runs smoothly on any modern gaming PC.',
  },
  {
    q: 'How does the quota system work?',
    a: 'Free plan users get 30 minutes of usage per 2-hour window. Pro plan users enjoy unlimited usage with no restrictions. Your usage resets automatically based on your rolling window.',
  },
  {
    q: 'Is Ghosted detectable?',
    a: 'Ghosted uses advanced stealth technology designed to operate undetected. However, we recommend using it responsibly and understanding the terms of service of the games you play.',
  },
  {
    q: 'Can I upgrade from Free to Pro anytime?',
    a: 'Yes! Upgrade anytime through our Discord server. Your Pro benefits activate immediately, and you can cancel anytime with no questions asked.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept payments through our official Discord server. Join our community at discord.gg/S7PsbJ2e to purchase Pro access securely.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with Ghosted Pro, contact us through Discord within 30 days of purchase for a full refund.',
  },
  {
    q: 'Who develops Ghosted?',
    a: 'Ghosted is developed and maintained by Dracaryn Studio, a team of passionate gamers building premium tools for the gaming community.',
  },
  {
    q: 'How do I get support?',
    a: 'Join our Discord community at discord.gg/S7PsbJ2e for 24/7 support. Pro users get priority direct support from our team.',
  },
]

export default function Home() {
  const user = useUser()
  const [discordLink, setDiscordLink] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (!res.ok) return
        const j = await res.json()
        const d = (j.settings || []).find((s: any) => s.key === 'discord_link')
        const val = d?.value || d?.value?.value || null
        if (mounted) setDiscordLink(val)
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  // update global CSS vars from mouse to drive sheen and hero parallax
  function handleRootMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const root = document.documentElement;
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    // set viewport relative positions
    try {
      root.style.setProperty('--mouse-x', `${Math.round(x * 100)}%`);
      root.style.setProperty('--mouse-y', `${Math.round(y * 100)}%`);
    } catch (err) {}
  }

  return (
    <>
      <SEO
        title="Plugcraft — Ghosted: High-performance gaming tools"
        description="Plugcraft (Ghosted) provides advanced network diagnostics and lag mitigation for fair play. Learn how to fix lag, detect issues, and use Ghosted responsibly."
        image="/assets/Ghosted_logo.png"
        canonical="https://plugcraft.online/"
      >
        {/* FAQ structured data as JSON-LD for rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.a,
                },
              })),
            }),
          }}
        />
      </SEO>
    <div onMouseMove={handleRootMouseMove} className="relative overflow-hidden min-h-screen">
      {/* Skip link for keyboard users */}
      <a href="#home-heading" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white/8 focus:text-white focus:px-3 focus:py-2 focus:rounded" aria-label="Skip to main content">Skip to main content</a>
      {/* Background image with dark overlay for contrast - use local optimized asset */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `linear-gradient(rgba(10,12,24,0.82),rgba(10,12,24,0.92)), url(${bg.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />
      {/* Animated lines overlay */}
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute inset-0 animated-lines" />
      </div>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden min-h-[80vh] flex flex-col justify-center items-center px-4 py-24 sm:px-8 lg:px-16">
  <div className="absolute inset-0 -z-10">
    <div className="bg-gradient-to-br from-indigo-900/80 via-purple-900/60 to-slate-900/80 w-full h-full" />
    <div className="absolute left-0 top-0 w-2/3 h-2/3 bg-blob blob-lg bg-gradient-to-br from-pink-500 to-indigo-500 animate-drift" />
    <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-blob blob-md bg-gradient-to-br from-cyan-400 to-blue-600 animate-drift" />
  </div>
  <div className="relative w-full max-w-3xl mx-auto glass-panel p-10 rounded-3xl shadow-xl flex flex-col items-center text-center">
    <h1 className="text-5xl sm:text-6xl font-extrabold gradient-heading mb-6 animate-fade-in">Dominate Every Match with Ghosted</h1>
    <p className="text-lg text-slate-200 mb-6 animate-fade-in delay-100">The most advanced lagswitch software trusted by competitive gamers. Zero detection, instant activation, and a beautiful interface that doesn't compromise on performance.</p>
    
    {/* Social Proof Stats */}
    <div className="flex flex-wrap gap-6 justify-center mb-8 animate-fade-in delay-200">
      <div className="flex flex-col items-center">
        <div className="text-3xl font-bold text-blue-400">5,000+</div>
        <div className="text-sm text-slate-400">Active Users</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-3xl font-bold text-green-400">99.9%</div>
        <div className="text-sm text-slate-400">Uptime</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-3xl font-bold text-purple-400">4.8/5</div>
        <div className="text-sm text-slate-400">User Rating</div>
      </div>
    </div>
    
    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
  <Link href={user ? '/dashboard' : '/signup'} className="btn-primary text-center text-lg px-8 py-4 group"><span className="flex items-center gap-2">{user ? 'Open dashboard' : 'Start Free Trial'} <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span></Link>
  <Link href="#features" className="btn-ghost text-center text-lg px-8 py-4"><span>See How It Works</span></Link>
    </div>
    <div className="mt-6 text-sm text-slate-400 animate-fade-in delay-400">⚡ <span className="soft-pill text-yellow-400 font-semibold">Limited time:</span> Free plan includes 30 mins on 2h window</div>
  </div>
  {/* Responsive logo lockup: horizontal (lg), stacked (md), icon-only (sm) */}
  <div className="relative flex items-center justify-center w-full mt-8 mb-2" style={{ minHeight: '140px' }}>
    <LogoLockup
      markSrc={GhostedLogo}
      wordmarkSrc={GhostedLogo}
      markAlt="Ghosted logo"
      wordmarkAlt="Ghosted — lagswitch software"
      className="logo-stack-hero"
    />
  </div>
</section>

      {/* Safety & Plans Section */}
  <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
    <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4 animate-fade-in">Choose Your Path to Victory</h2>
          <p className="text-lg text-slate-300 mb-8 animate-fade-in delay-100 max-w-3xl mx-auto">
            Start free and upgrade when you're ready. All plans include our proprietary stealth technology and 24/7 support.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 animate-fade-in delay-200" style={{ perspective: '1000px' }}>
          <Card3DRotate className="glass-panel p-8 rounded-2xl w-full md:w-1/2 transition-all hover:scale-105">
            <div className="text-center mb-4">
              <span className="soft-pill bg-green-500 text-black">MOST POPULAR</span>
            </div>
            <h3 className="text-xl font-bold text-green-200 mb-2">Free Plan</h3>
            <div className="text-3xl font-bold text-white mb-2">$0<span className="text-lg text-slate-400">/forever</span></div>
            <p className="text-slate-200 mb-4">Perfect for trying Ghosted risk-free.</p>
            <ul className="text-green-100 text-left text-sm space-y-2 mb-6">
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>30 mins usage per 2 hour window</span></li>
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>All security & stealth features</span></li>
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Community support</span></li>
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>No ads, no tracking</span></li>
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Instant activation</span></li>
            </ul>
            <Link href="/signup" className="btn-primary w-full text-center group"><span className="flex items-center justify-center gap-2">Start Free Trial <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span></Link>
          </Card3DRotate>
          <Card3DRotate className="glass-panel p-8 rounded-2xl w-full md:w-1/2 border-2 border-indigo-500/50 transition-all hover:scale-105 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">RECOMMENDED</span>
            </div>
            <div className="text-center mb-4">
              <span className="soft-pill bg-indigo-500 text-white">BEST VALUE</span>
            </div>
            <h3 className="text-xl font-bold text-indigo-200 mb-2">Pro Plan</h3>
            <div className="text-3xl font-bold text-white mb-2">$3.99<span className="text-lg text-slate-400">/month</span></div>
            <p className="text-slate-200 mb-4">Unlimited power for serious gamers.</p>
            <ul className="text-indigo-100 text-left text-sm space-y-2 mb-6">
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Unlimited usage</span></li>
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Priority updates & features</span></li>
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Advanced stealth technology</span></li>
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Direct support</span></li>
              <li className="flex items-start gap-2"><svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Early access to new tools</span></li>
            </ul>
            <a href={discordLink || 'https://discord.gg/S7PsbJ2e'} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center group"><span className="flex items-center justify-center gap-2">Get Pro Access <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span></a>
          </Card3DRotate>
          </div>
      <div className="mt-10 animate-fade-in delay-300">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <span className="flex items-center gap-2 text-green-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                30-day money-back guarantee
              </span>
              <span className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No setup fees
              </span>
              <span className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

  <section id="features" className="relative py-20 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Ghosted?</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">Built for performance, designed for gamers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div key={feature.title} className="glass-panel p-8 rounded-2xl text-center hover:scale-105 transition-transform duration-300 border border-purple-500/20 hover:border-purple-500/40 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  {index === 0 && (
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold gradient-heading mb-3">{feature.title}</h3>
                  <p className="text-base text-slate-200">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

  <section id="workflow" className="animate-fade-in-up delay-300">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-white">Launch in three simple steps</h2>
            <p className="mt-4 text-slate-300">From signup to download, Plugcraft automates the Ghosted journey so users never wonder what’s next.</p>
          </div>
          <div className="space-y-10" style={{ perspective: '1000px' }}>
            {workflow.map((item, index) => (
              <div key={item.step} className="glass-card flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 shadow shadow-indigo-500/5 sm:flex-row sm:items-start">
                <div>
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-semibold text-indigo-200">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.step}</h3>
                    <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

  <section className="animate-fade-in-up delay-400">
    <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-white mb-6">Why Ghosted?</h2>
      <p className="mt-4 text-base text-slate-300 max-w-2xl mx-auto mb-8">
        Ghosted is engineered for gamers who want the edge—no bloat, no hassle, just pure lag control. Developed by <span className="font-semibold text-white">Dracaryn Studio</span>.
      </p>

      <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
        <span className="soft-pill hover:bg-white/10 transition-colors cursor-default">⚡ Plug & Play</span>
        <span className="soft-pill hover:bg-white/10 transition-colors cursor-default">🎨 Beautiful UI</span>
        <span className="soft-pill hover:bg-white/10 transition-colors cursor-default">🎮 Made for Gamers</span>
        <span className="soft-pill hover:bg-white/10 transition-colors cursor-default">🔒 Secure & Private</span>
      </div>

      {/* Consolidated Discord CTA */}
      <div className="mt-12 glass-panel p-8 rounded-2xl border border-indigo-500/30">
        <div className="flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Join Our Community</h3>
        <p className="text-slate-300 mb-6">Get 24/7 support, purchase Pro access, and connect with fellow gamers on Discord</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={discordLink || 'https://discord.gg/S7PsbJ2e'} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center rounded-md px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-indigo-400 group">
            <span className="flex items-center gap-2">Join Discord <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
          </a>
        </div>
        <div className="mt-4 text-sm text-slate-400">
          Server: <span className="text-indigo-300 font-mono">{discordLink ? (() => { try { return new URL(discordLink).pathname.replace('/', '') } catch { return discordLink } })() : 'S7PsbJ2e'}</span>
        </div>
      </div>
    </div>
  </section>

  {/* Video Tutorial & FAQ Section */}
  <section id="faqs" className="animate-fade-in-up delay-500">
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Learn How to Use Ghosted</h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Watch our comprehensive tutorial and find answers to common questions
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Video Tutorial */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Video Tutorial</h3>
                <p className="text-sm text-slate-400">Complete setup & usage guide</p>
              </div>
            </div>
            
            {/* Video Thumbnail Preview */}
            <div className="relative aspect-video rounded-xl overflow-hidden mb-4 group">
              <img
                src="https://img.youtube.com/vi/qzDBeWuuX0s/maxresdefault.jpg"
                alt="Ghosted Tutorial Thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-red-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>

            <a
              href="https://youtu.be/qzDBeWuuX0s?si=WjKG6c8VmyWc1zg6"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span>Watch Video Tutorial</span>
            </a>
            
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">📺 What you'll learn:</strong><br/>
                • Installing Ghosted on your system<br/>
                          <a href={discordLink || 'https://discord.gg/S7PsbJ2e'} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center rounded-md px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-indigo-400"><span>Join Discord for Support & Purchase</span></a>
                          <a href={discordLink || 'https://discord.gg/S7PsbJ2e'} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center rounded-md border border-white/30 px-6 py-3 text-base font-semibold text-white/80 transition hover:border-white/60 hover:text-white"><span>Public Discord: {discordLink ? new URL(discordLink).pathname.replace('/', '') : 'S7PsbJ2e'}</span></a>
                • Managing your usage quota<br/>
                • Pro tips for optimal performance
              </p>
            </div>
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Frequently Asked Questions</h3>
              <p className="text-sm text-slate-400">Quick answers to common queries</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {faqs.map((item, index) => (
              <details 
                key={item.q} 
                className="glass-card rounded-xl border border-purple-500/20 bg-white/5 p-4 hover:border-purple-500/40 transition-colors group"
              >
                <summary className="cursor-pointer text-base font-semibold text-white flex items-start gap-3 list-none">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="flex-1">{item.q}</span>
                  <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 ml-9 text-sm leading-relaxed text-slate-300">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>

  <section className="animate-fade-in-up delay-600" style={{ perspective: '1000px' }}>
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="glass-panel px-8 py-10 text-center rounded-2xl border border-blue-500/30">
            <h2 className="text-2xl font-bold text-white sm:text-3xl mb-4">Ready to Get Started?</h2>
            <p className="mt-4 text-base text-indigo-100 max-w-2xl mx-auto">
              Join thousands of gamers using Ghosted for competitive advantage. Start your free trial today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={user ? '/dashboard' : '/signup'} className="btn-primary inline-flex items-center rounded-md px-8 py-4 text-lg font-semibold text-white shadow transition hover:bg-indigo-400 group">
                <span className="flex items-center gap-2">{user ? 'Go to Dashboard' : 'Start Free Trial'} <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></span>
              </Link>
              <Link href="#faqs" className="btn-ghost inline-flex items-center rounded-md border border-white/30 px-8 py-4 text-lg font-semibold text-white/80 transition hover:border-white/60 hover:text-white">
                <span>Learn More</span>
              </Link>
            </div>
      {/* Glassmorphism and animated lines CSS moved to globals.css */}
          </div>
        </div>
      </section>
      {/* Animations moved to globals.css */}
    </div>
    </>
  )
}
