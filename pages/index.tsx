import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@supabase/auth-helpers-react'
// Use public assets for logos
const ASSET_VERSION = 'v2'
const GhostedLogo = `/assets/Ghosted_logo.png?${ASSET_VERSION}`
const SoftwareLogo = `/assets/software_logo.png?${ASSET_VERSION}`
const DracarynLogo = `/assets/dracarynlogo.png?${ASSET_VERSION}`
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
    a: 'Ghosted is a lagswitch software for gamers, offering plug-and-play simplicity, a beautiful UI, and real-time control.',
  },
  {
    q: 'Who makes Ghosted?',
    a: 'Ghosted is developed and maintained by Dracaryn Studio, a team of passionate gamers building tools for the community.',
  },
  {
    q: 'Is Ghosted safe to use?',
    a: 'Yes. Every download is tracked, usage is private, and your account is protected by secure authentication.',
  },
]

export default function Home() {
  const user = useUser()

  return (
    <div className="relative overflow-hidden min-h-screen">
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
      <section className="relative overflow-hidden" aria-labelledby="home-heading">
        {/* Decorative gradient blobs for depth */}
        <div className="absolute -left-40 top-8 bg-blob blob-lg bg-gradient-to-br from-pink-500 to-indigo-500 animate-drift" aria-hidden="true" />
        <div className="absolute right-0 -bottom-32 bg-blob blob-md bg-gradient-to-br from-cyan-400 to-blue-600 animate-drift" aria-hidden="true" />

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            {/* Text column */}
            <div className="md:col-span-7">
              <div className="mb-6 inline-flex items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/8 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200 shadow-sm">
                  Ghosted — Plug & Play
                </span>
              </div>

              <h1 id="home-heading" className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white gradient-heading">
                Take control. Win more.
              </h1>

              <p className="mt-6 text-lg text-slate-200 max-w-2xl">
                Experience seamless lag control with a beautiful UI, instant setup, and real-time control. Ghosted is built for gamers who want to focus on play — not configuration.
              </p>

              <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center gap-4">
                <Link
                  href={user ? '/dashboard' : '/signup'}
                  className="btn-primary"
                  aria-label={user ? 'Open dashboard' : 'Sign up for Ghosted'}
                >
                  {user ? 'Open dashboard' : 'Get Ghosted now'}
                </Link>

                <Link href={user ? '/login' : '#features'} className="btn-ghost" aria-label="Explore features">
                  Explore features
                </Link>
              </div>
            </div>

            {/* Visual column: layered glass card */}
            <div className="md:col-span-5 relative flex justify-center md:justify-end">
              <div className="relative w-full max-w-md">
                {/* Subtle tilted shadow layer for depth */}
                <div className="absolute -inset-6 transform rotate-3 rounded-2xl glass-panel opacity-60" aria-hidden="true" />
                <div className="absolute -inset-10 transform -rotate-2 rounded-3xl bg-gradient-to-br from-black/40 to-transparent blur-3xl opacity-30" aria-hidden="true" />

                <div className="relative glass-panel glass-outline p-4 transform-gpu will-change-transform animate-fade-in-up">
                  <div className="rounded-xl overflow-hidden border border-white/6 shadow-2xl">
                    <Image
                      src={SoftwareLogo}
                      alt="Ghosted UI preview"
                      width={540}
                      height={320}
                      sizes="(max-width: 768px) 100vw, 540px"
                      className="object-cover w-full h-auto"
                      style={{ height: 'auto', width: 'auto' }}
                      aria-hidden="false"
                    />
                  </div>
                </div>

                {/* Small badge/logo at the base */}
                <div className="absolute -bottom-6 left-4 flex items-center gap-3">
                  <Image src={GhostedLogo} alt="Ghosted logo" width={120} height={56} className="drop-shadow-lg" style={{ width: 'auto', height: 'auto' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Plans Section */}
  <section className="relative z-10 border-t border-white/5 bg-gradient-to-br from-black/80 via-indigo-950/80 to-slate-950/90 py-20 px-4 sm:px-6 lg:px-8 animate-fade-in-up glass-card">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6 animate-fade-in">Safe. Secure. Undetectable.</h2>
          <div className="mx-auto max-w-2xl text-lg text-slate-300 mb-8 animate-fade-in delay-100">
            Ghosted uses advanced security features and proprietary stealth technology to keep you safe and undetectable. Every session is protected by end-to-end encryption, anti-tamper checks, and real-time monitoring. No logs, no leaks, no worries.
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 animate-fade-in delay-200">
            <div className="rounded-2xl border border-green-400/30 bg-gradient-to-br from-green-900/30 to-slate-900/40 px-8 py-8 shadow-lg shadow-green-500/10 w-full md:w-1/2 transition-transform hover:scale-105 hover:shadow-green-400/30 glass-card">
              <h3 className="text-xl font-bold text-green-200 mb-2">Free Plan</h3>
              <p className="text-slate-200 mb-2">Try Ghosted for free—no credit card required.</p>
              <ul className="text-green-100 text-left text-sm space-y-1">
                <li>✔ 2 hours usage per 5 hour window</li>
                <li>✔ All security features</li>
                <li>✔ Community support</li>
                <li>✔ No ads, no tracking</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-900/30 to-slate-900/40 px-8 py-8 shadow-lg shadow-indigo-500/10 w-full md:w-1/2 transition-transform hover:scale-105 hover:shadow-indigo-400/30 glass-card">
              <h3 className="text-xl font-bold text-indigo-200 mb-2">Pro Plan</h3>
              <p className="text-slate-200 mb-2">Unlock unlimited usage and premium support.</p>
              <ul className="text-indigo-100 text-left text-sm space-y-1">
                <li>✔ Unlimited usage</li>
                <li>✔ Priority updates</li>
                <li>✔ All security & stealth features</li>
                <li>✔ Early access to new tools</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 animate-fade-in delay-300">
            <span className="inline-block rounded-full bg-green-600/20 px-4 py-2 text-green-200 font-semibold text-sm tracking-wider border border-green-400/30 shadow shadow-green-500/10 animate-pulse">Undetectable. Free to try. Upgrade anytime.</span>
          </div>
        </div>
      </section>

  <section id="features" className="border-t border-white/5 bg-black/20 animate-fade-in-up delay-200 glass-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid gap-10 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 shadow-lg shadow-indigo-500/10 glass-card">
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

  <section id="workflow" className="border-t border-white/5 bg-slate-900/60 animate-fade-in-up delay-300 glass-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-white">Launch in three simple steps</h2>
            <p className="mt-4 text-slate-300">From signup to download, Plugcraft automates the Ghosted journey so users never wonder what’s next.</p>
          </div>
          <div className="space-y-10">
            {workflow.map((item, index) => (
              <div key={item.step} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6 shadow shadow-indigo-500/5 sm:flex-row sm:items-start glass-card">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-semibold text-indigo-200">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.step}</h3>
                  <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

  <section className="border-t border-white/5 bg-black/40 animate-fade-in-up delay-400 glass-card">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Why Ghosted?</h2>
          <p className="mt-4 text-base text-slate-300">
            Ghosted is engineered for gamers who want the edge—no bloat, no hassle, just pure lag control. Developed by <span className="font-semibold text-white">Dracaryn Studio</span>.
          </p>
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1">Plug & Play</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1">Beautiful UI</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1">Made for Gamers</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1">Secure & Private</span>
          </div>
            <div className="mt-10 flex justify-center">
                  <Image src={DracarynLogo} alt="Dracaryn Studio Logo" width={96} height={48} style={{ width: 'auto', height: 'auto' }} priority />
          </div>
        </div>
      </section>

  <section id="faqs" className="border-t border-white/5 bg-slate-900/60 animate-fade-in-up delay-500 glass-card">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center">FAQs</h2>
          <div className="mt-10 space-y-6">
            {faqs.map((item) => (
              <details key={item.q} className="rounded-xl border border-white/10 bg-white/5 p-5 glass-card">
                <summary className="cursor-pointer text-lg font-semibold text-white">{item.q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

  <section className="border-t border-white/5 bg-black/60 animate-fade-in-up delay-600 glass-card">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-8 py-10 text-center shadow-lg shadow-indigo-500/20 glass-card">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to power Ghosted with Plugcraft?</h2>
            <p className="mt-4 text-base text-indigo-100">
              Launch verified onboarding, usage visibility, and secure downloads today.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="https://discord.gg/S7PsbJ2e" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-indigo-400">
                Join Discord for Support & Purchase
              </a>
              <a href="https://discord.gg/S7PsbJ2e" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md border border-white/30 px-6 py-3 text-base font-semibold text-white/80 transition hover:border-white/60 hover:text-white">
                Public Discord: S7PsbJ2e
              </a>
            </div>
      {/* Glassmorphism and animated lines CSS moved to globals.css */}
          </div>
        </div>
      </section>
      {/* Animations moved to globals.css */}
    </div>
  )
}
