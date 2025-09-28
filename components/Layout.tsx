import Link from 'next/link'
import Image from 'next/image'
import bg from '../assets/background.png'
import { useRouter } from 'next/router'
import { ReactNode, useState } from 'react'
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

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await supabaseClient.auth.signOut()
      router.push('/')
    } finally {
      setIsSigningOut(false)
    }
  }

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
      <header className="border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/Ghosted_logo.png" alt="Plugcraft" width={36} height={36} />
            <span className="text-xl font-semibold tracking-tight text-white">Plugcraft</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="transition hover:text-white">
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center rounded-md border border-indigo-500/70 px-3 py-1.5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/10"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="inline-flex items-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-400 disabled:opacity-60"
                >
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-300 transition hover:text-white">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-400"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
        <nav className="md:hidden border-t border-white/5">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-3 text-sm text-slate-300">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="transition hover:text-white">
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/5 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
            <Image src="/assets/dracarynlogo.png" alt="Dracaryn Studio Logo" width={96} height={48} />
            <span>&copy; 2025 Dracaryn Studio. All rights reserved.</span>
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