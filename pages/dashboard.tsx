import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useSession, useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import ProtectedRoute from '../components/ProtectedRoute'
import UsageCard from '../components/UsageCard'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>Plugcraft dashboard</title>
      </Head>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const user = useUser()
  const session = useSession()
  const supabaseClient = useSupabaseClient()
  // Direct MEGA download URL
  const downloadUrl = 'https://mega.nz/folder/9cxgHL7a#-IdZCF_duekyBp5w-lMWoQ'
  const [profileName, setProfileName] = useState<string>('')

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        // Defensive: user.id may be string or undefined
        if (!user.id) return
        // Use 'user_id' IS NOT NULL if user_id is nullable in schema
        const { data, error, status } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle()
        if (error) {
          // Log error for debugging
          console.error('Failed to fetch profile name:', error.message)
          setProfileName('')
          return
        }
        if (data?.full_name) {
          setProfileName(data.full_name)
        } else {
          setProfileName('')
        }
      } catch (err) {
        console.error('Unexpected error fetching profile name:', err)
        setProfileName('')
      }
    })()
  }, [supabaseClient, user])

  // Persist a simple trusted-device marker when arriving from a magic link redirect
  useEffect(() => {
    try {
      if (!user) return
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      if (url.searchParams.get('trusted') === '1') {
        const key = `trusted_device:${user.email?.toLowerCase() || user.id}`
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days
        localStorage.setItem(key, expiresAt)
        // Clean the query param without reloading the page
        url.searchParams.delete('trusted')
        window.history.replaceState({}, document.title, url.pathname + url.search)
      }
    } catch (e) {
      // non-fatal
    }
  }, [user])

  // No-op: download is now a direct link
  const handleDownload = () => {
    window.open(downloadUrl, '_blank', 'noopener')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow animate-fade-in-up">Welcome back{profileName ? `, ${profileName}` : ''}</h1>
          <p className="mt-3 text-base text-slate-300 max-w-xl">
            Monitor your Ghosted usage, download the latest build, and keep track of your account status.
          </p>
        </div>
        <div className="glass-card px-6 py-4 text-sm text-slate-200 shadow-lg animate-fade-in-up delay-200" aria-label="Account details">
          <p className="font-semibold">Account</p>
          <p className="mt-1 text-slate-300" aria-label="User email">{user?.email}</p>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section className="glass-card p-8 shadow-2xl border border-indigo-500/30 animate-fade-in-up" aria-labelledby="download-title">
            <h2 id="download-title" className="text-xl font-bold text-white flex items-center gap-2">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v14m0 0l-4-4m4 4l4-4" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="17" width="16" height="4" rx="2" fill="#818CF8" fillOpacity=".12"/></svg>
              Download Ghosted
            </h2>
            <p className="mt-2 text-sm text-indigo-100">
              Plugcraft generates a fresh signed link for every download. Links expire one hour after they are created.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-600 to-fuchsia-500 px-5 py-2.5 text-base font-semibold text-white shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Download latest build"
              >
                Download latest build
              </a>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Direct download link"
              >
                Direct download link
              </a>
            </div>
          </section>

          <section className="glass-card p-8 shadow-2xl border border-white/10 animate-fade-in-up delay-200" aria-labelledby="announcements-title">
            <h2 id="announcements-title" className="text-lg font-semibold text-white">Latest announcements</h2>
            <p className="mt-2 text-sm text-slate-300">
              Stay tuned for patch notes and tournament updates. Check your inbox for verification and billing receipts.
            </p>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-card p-8 shadow-2xl border border-white/10 animate-fade-in-up delay-100" aria-labelledby="usage-title">
            <UsageCard />
          </section>
          <section className="glass-card p-8 shadow-2xl border border-white/10 text-sm text-slate-300 animate-fade-in-up delay-300" aria-labelledby="quota-title">
            <h2 id="quota-title" className="text-lg font-semibold text-white">Need extra quota?</h2>
            <p className="mt-2">
              Reach out to the Plugcraft team and we’ll adjust your Ghosted usage limits or enable premium add-ons for your roster.
            </p>
            <a href="mailto:support@plugcraft.io" className="mt-3 inline-flex text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
              Contact support →
            </a>
          </section>
        </div>
      </div>
    </div>
  )
}