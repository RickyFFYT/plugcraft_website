import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
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
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [announcementsList, setAnnouncementsList] = useState<any[]>([])
  const [latestRelease, setLatestRelease] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        // Defensive: user.id may be string or undefined
        if (!user.id) return
        // Only fetch the user's display name client-side. Do NOT rely on client-side
        // profile.is_admin or the admin_emails table for admin checks — use the
        // server-side `/api/admin/check` endpoint instead (see below).
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle()
        if (error) {
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

  // Use server-side admin check (covers profiles.is_admin, admin_emails and admins table)
  useEffect(() => {
    if (!session) return
    ;(async () => {
      try {
        const res = await fetch('/api/admin/check', { cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}` } })
        const j = await res.json()
        setIsAdmin(!!j.isAdmin)
      } catch (e) {
        setIsAdmin(false)
      }
    })()
  }, [session])

  // Fetch public announcements
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/announcements')
        if (!res.ok) return
        const j = await res.json()
        setAnnouncementsList(j.announcements || [])
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  // Fetch public site settings (including latest_release)
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (!res.ok) return
        const j = await res.json()
        const release = (j.settings || []).find((s: any) => s.key === 'latest_release')
        setLatestRelease(release?.value || null)
      } catch (e) {
        // ignore
      }
    })()
  }, [])

  const getDownloadUrl = () => {
    return latestRelease?.download_url || downloadUrl
  }
  const handleDownload = () => {
    const url = getDownloadUrl()
    window.open(url, '_blank', 'noopener')
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
        <div className="glass-card glass-panel liquid-glass force-sheen px-4 py-3 text-sm text-slate-200 shadow-lg animate-fade-in-up delay-200" aria-label="Account details">
          <p className="font-semibold">Account</p>
          <p className="mt-1 text-slate-300" aria-label="User email">{user?.email}</p>
          {isAdmin && (
            <div className="mt-3">
              <Link href="/admin" className="inline-flex items-center gap-2 rounded bg-yellow-600 px-3 py-1 text-sm font-semibold text-black">Admin Panel</Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section className="glass-card glass-panel liquid-glass force-sheen p-8 shadow-2xl border border-indigo-500/30 animate-fade-in-up" aria-labelledby="download-title">
            <h2 id="download-title" className="text-xl font-bold text-white flex items-center gap-2">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v14m0 0l-4-4m4 4l4-4" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="17" width="16" height="4" rx="2" fill="#818CF8" fillOpacity=".12"/></svg>
              Download Ghosted
            </h2>
            <p className="mt-2 text-sm text-indigo-100">
              Plugcraft generates a fresh signed link for every download. Links expire one hour after they are created.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={getDownloadUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg btn-primary"
                aria-label="Download latest build"
              >
                Download latest build {latestRelease?.version ? `(${latestRelease.version})` : ''}
              </a>
            </div>
          </section>

          <section className="glass-card glass-panel liquid-glass force-sheen p-8 shadow-2xl border border-white/10 animate-fade-in-up delay-200" aria-labelledby="announcements-title">
            <h2 id="announcements-title" className="text-lg font-semibold text-white">Latest announcements</h2>
            <div className="mt-4">
               {announcementsList.length === 0 ? (
                <p className="text-sm text-slate-300">No announcements</p>
               ) : (
                 <ul className="space-y-3">
                   {announcementsList.map((a: any) => (
                    <li key={a.id} className="p-4 rounded-lg">
                      <div className="text-lg font-semibold gradient-heading leading-tight">{a.title}</div>
                      <div className="mt-2 text-base text-slate-200 leading-relaxed">{a.body}</div>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
           </section>
        </div>

        <div className="space-y-8">
          <section className="glass-card glass-panel liquid-glass force-sheen p-8 shadow-2xl border border-white/10 animate-fade-in-up" aria-labelledby="usage-title">
            <UsageCard />
          </section>
          <section className="glass-card glass-panel liquid-glass force-sheen p-8 shadow-2xl border border-white/10 text-sm text-slate-300 animate-fade-in-up delay-300" aria-labelledby="quota-title">
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