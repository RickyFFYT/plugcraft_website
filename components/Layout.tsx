import Link from 'next/link'
import bg from '../assets/background.png'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { ReactNode, useState, useEffect, useRef } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'How it works', href: '#workflow' },
  { name: 'FAQs', href: '#faqs' },
]

export default function Layout({ children }: LayoutProps) {
  const user = useUser()
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const menuCloseTimerRef = useRef<number | null>(null)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await supabaseClient.auth.signOut()
      router.push('/')
    } finally {
      setIsSigningOut(false)
    }
  }

  // Toggle header 'scrolled' class when user scrolls a small amount and reduce heavy animations for performance
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      const sc = window.scrollY > 8
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(sc)
          // when page is scrolled, reduce large background animations to prevent jank
          if (sc) document.body.classList.add('reduce-anim')
          else document.body.classList.remove('reduce-anim')
          ticking = false
        })
        ticking = true
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // When the mobile panel opens, focus the first actionable link for keyboard users.
  useEffect(() => {
    if (mobileOpen) {
      // Focus the first link inside the mobile panel for keyboard users
      setTimeout(() => {
        const firstAnchor = document.querySelector('#mobile-menu a') as HTMLAnchorElement | null
        firstAnchor?.focus()
      }, 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Close desktop dropdown on outside click or Escape key
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div
      className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col"
      style={{
        backgroundImage: `url(${bg.src || '/assets/background.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* subtle overlay so text is readable over busy backgrounds */}
      <div className="absolute inset-0 -z-10 bg-black/40" aria-hidden="true" />
      <header className={`site-header glass-card ${scrolled ? 'scrolled' : ''}`} style={{ minHeight: '48px', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
        <div className="container mx-auto grid grid-cols-[auto_1fr_auto] items-center max-w-7xl px-2 md:px-4" style={{ minHeight: '48px' }}>
          <div className="brand">
            <Link href="/" className="flex items-center gap-2 md:gap-3" aria-label="Go to homepage">
              {/* Compact logo: smaller on all screens, better vertical alignment */}
              <Image
                src="/assets/Ghosted_logo.png?v=2"
                alt="Plugcraft"
                width={48}
                height={48}
                className="w-9 h-9 md:w-12 md:h-12 object-contain block"
                style={{ width: 'auto', height: 'auto' }}
              />
              <span className="brand-title gamer-title text-lg md:text-xl leading-none" aria-hidden="false">Plugcraft</span>
            </Link>
          </div>

          {/* Desktop dropdown menu to keep header compact */}
          <div className="desktop-nav hidden md:flex justify-center items-center">
            <div
              className="relative"
              onMouseEnter={() => {
                if (menuCloseTimerRef.current) {
                  window.clearTimeout(menuCloseTimerRef.current)
                  menuCloseTimerRef.current = null
                }
                setMenuOpen(true)
              }}
              onMouseLeave={() => {
                // Small delay to allow mouse transitions between button and dropdown
                menuCloseTimerRef.current = window.setTimeout(() => setMenuOpen(false), 160)
              }}
            >
              <button
                id="menu-button"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white transition"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((s) => !s)}
                onFocus={() => { if (menuCloseTimerRef.current) { clearTimeout(menuCloseTimerRef.current); menuCloseTimerRef.current = null } setMenuOpen(true) }}
                onBlur={() => { menuCloseTimerRef.current = window.setTimeout(() => setMenuOpen(false), 160) }}
                ref={(el) => { /* silent ref to avoid forwarding */ }}
              >
                Menu
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div id="menu-dropdown" role="menu" className={`dropdown-menu ${menuOpen ? 'open' : ''}`} aria-labelledby="menu-button" ref={menuRef} onMouseEnter={() => { if (menuCloseTimerRef.current) { clearTimeout(menuCloseTimerRef.current); menuCloseTimerRef.current = null } }} onMouseLeave={() => { menuCloseTimerRef.current = window.setTimeout(() => setMenuOpen(false), 160) }}>
                <ul>
                  {navigation.map((item) => (
                    <li key={item.name} role="none">
                      <Link href={item.href} role="menuitem" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Actions & mobile toggle aligned right */}
          <div className="flex items-center gap-3 justify-end">
            {user ? (
              <>
                <Link href="/dashboard" className="hidden sm:inline-flex items-center rounded-md border border-indigo-500/70 btn-ghost">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} disabled={isSigningOut} className="inline-flex items-center rounded-md btn-ghost">
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex text-base font-medium text-slate-300 transition hover:text-white">
                  Log in
                </Link>
                <Link href="/signup" className="hidden sm:inline-flex items-center rounded-md btn-primary">
                  Get started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className={`hamburger-btn md:hidden ${mobileOpen ? 'open' : ''}`}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-controls="mobile-menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((s) => !s)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMobileOpen((s) => !s) }}
            >
              <span className="bar" aria-hidden="true" />
              <span className="bar" aria-hidden="true" />
              <span className="bar" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile panel is controlled via client-side state (see component code below) */}
        <div id="mobile-menu" role="dialog" aria-modal={mobileOpen} className={`mobile-menu-panel ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}>
          <button className="mobile-close-btn" aria-label="Close menu" onClick={() => setMobileOpen(false)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMobileOpen(false) }}>×</button>
           <nav aria-label="Mobile menu">
             <ul>
               {navigation.map((item) => (
                 <li key={item.href} className="mb-2">
                   <Link href={item.href} className="block px-3 py-2 rounded-md text-slate-200 hover:bg-white/3" onClick={() => setMobileOpen(false)}>{item.name}</Link>
                 </li>
               ))}
             </ul>
             <div className="mt-4 border-t border-white/6 pt-4">
               {!user ? (
                 <div className="space-y-2">
                   <Link href="/login" className="block w-full text-center rounded-md px-4 py-2 bg-white/5 text-white" onClick={() => setMobileOpen(false)}>Log in</Link>
                   <Link href="/signup" className="block w-full text-center rounded-md px-4 py-2 btn-primary" onClick={() => setMobileOpen(false)}>Get started</Link>
                 </div>
               ) : (
                 <div className="space-y-2">
                   <Link href="/dashboard" className="block w-full text-center rounded-md px-4 py-2 bg-white/5 text-white" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                   <button className="block w-full text-center rounded-md px-4 py-2 bg-white/5 text-white" onClick={() => { setMobileOpen(false); handleSignOut(); }}>Sign out</button>
                 </div>
               )}
             </div>
           </nav>
         </div>
      </header>
      {/* end header */}

      <main className="flex-1">{children}</main>

      <footer className="site-footer border-t border-white/5 bg-black/30">
        <div className="footer-inner mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/dracarynlogo.png?v=2"
              alt="Dracaryn Studio Logo"
              width={96}
              height={48}
              className="w-20 h-auto object-contain block"
              style={{ width: 'auto', height: 'auto' }}
            />
            <span className="text-xs sm:text-sm">&copy; 2025 Dracaryn Studio. All rights reserved.</span>
          </div>
          <div className="flex gap-4">
            <Link href="mailto:support@ghosted.gg" className="hover:text-white transition">
              Contact
            </Link>
            <Link href="#faqs" className="hover:text-white transition">
              FAQs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}