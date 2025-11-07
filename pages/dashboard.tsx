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
  const [discordLink, setDiscordLink] = useState<string | null>(null)
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

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
        setIsLoadingAnnouncements(true)
        const res = await fetch('/api/admin/announcements')
        if (!res.ok) return
        const j = await res.json()
        setAnnouncementsList(j.announcements || [])
      } catch (e) {
        // ignore
      } finally {
        setIsLoadingAnnouncements(false)
      }
    })()
  }, [])

  // Fetch public site settings (including latest_release)
  useEffect(() => {
    ;(async () => {
      try {
        setIsLoadingSettings(true)
        const res = await fetch('/api/admin/settings')
        if (!res.ok) return
        const j = await res.json()
  const release = (j.settings || []).find((s: any) => s.key === 'latest_release')
  setLatestRelease(release?.value || null)
  const d = (j.settings || []).find((s: any) => s.key === 'discord_link')
  const dv = d?.value || d?.value?.value || null
  setDiscordLink(dv)
      } catch (e) {
        // ignore
      } finally {
        setIsLoadingSettings(false)
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
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow animate-fade-in-up flex items-center gap-3">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Welcome back{profileName ? `, ${profileName}` : ''}
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-xl">
            Monitor your Ghosted usage, download the latest build, and keep track of your account status.
          </p>
        </div>
  <div className="glass-card glass-panel px-4 py-3 text-sm text-slate-200 shadow-lg border border-indigo-500/20" aria-label="Account details">
    <div className="animate-fade-in-up delay-200">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="font-semibold text-white">Account</p>
      </div>
      <p className="mt-1 text-slate-300 flex items-center gap-2" aria-label="User email">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {user?.email}
      </p>
      {isAdmin && (
        <div className="mt-3">
          <Link href="/admin" className="inline-flex items-center gap-2 rounded bg-gradient-to-r from-yellow-500 to-orange-600 px-3 py-1 text-sm font-semibold text-black hover:scale-105 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin Panel
          </Link>
        </div>
      )}
    </div>
  </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <section className="glass-card glass-panel p-8 shadow-2xl border border-indigo-500/30 hover:border-indigo-500/50 transition-colors" aria-labelledby="download-title">
            <div className="animate-fade-in-up">
              <h2 id="download-title" className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v14m0 0l-4-4m4 4l4-4" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="17" width="16" height="4" rx="2" fill="#818CF8" fillOpacity=".12"/></svg>
                Download Ghosted
              </h2>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-indigo-100">
                    Plugcraft generates a fresh signed link for every download. Links expire one hour after they are created.
                  </p>
                </div>
              </div>
              {latestRelease?.version && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-slate-400">Latest Version:</span>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm font-semibold">{latestRelease.version}</span>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={getDownloadUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg btn-primary group text-lg px-6 py-3"
                  aria-label="Download latest build"
                >
                  <span className="flex items-center gap-2">
                    {isLoadingSettings ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Now
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </a>
              </div>
            </div>
          </section>

          <section className="glass-card glass-panel p-8 shadow-2xl border border-purple-500/20" aria-labelledby="announcements-title">
            <div className="animate-fade-in-up delay-200">
              <h2 id="announcements-title" className="text-2xl font-semibold text-white flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Latest Announcements
              </h2>
              <div className="mt-4">
                 {isLoadingAnnouncements ? (
                   <div className="space-y-3">
                     <div className="animate-pulse bg-white/5 rounded-lg p-4">
                       <div className="h-4 bg-white/10 rounded mb-3 w-3/4"></div>
                       <div className="h-3 bg-white/10 rounded mb-2"></div>
                       <div className="h-3 bg-white/10 rounded w-2/3"></div>
                     </div>
                   </div>
                 ) : announcementsList.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm text-slate-400">No announcements at this time</p>
                  </div>
                 ) : (
                   <ul className="space-y-3">
                     {announcementsList.map((a: any) => (
                      <li key={a.id} className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <div className="text-lg font-semibold gradient-heading leading-tight">{a.title}</div>
                            <div className="mt-2 text-base text-slate-200 leading-relaxed">{a.body}</div>
                          </div>
                        </div>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-card glass-panel p-8 shadow-2xl border border-white/10" aria-labelledby="usage-title">
            <div className="animate-fade-in-up">
              <UsageCard />
            </div>
          </section>
          <section className="glass-card glass-panel p-8 shadow-2xl border border-white/10 text-sm text-slate-300" aria-labelledby="quota-title">
            <div className="animate-fade-in-up delay-300">
              <h2 id="quota-title" className="text-lg font-semibold text-white">Need extra quota?</h2>
              <p className="mt-2">
                Reach out to the Plugcraft team and we’ll adjust your Ghosted usage limits or enable premium add-ons for your roster.
              </p>
              <a href="mailto:support@plugcraft.io" className="mt-3 inline-flex text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                Contact support →
              </a>
            </div>
          </section>
          <section className="glass-card glass-panel p-6 shadow-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 text-sm text-slate-300">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-10 h-10 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <h2 className="text-xl font-semibold text-white">Join our Discord</h2>
              </div>
              <p className="mt-2 text-slate-300 leading-relaxed">Connect with the community, get 24/7 support, and unlock Pro features.</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Direct support from developers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Purchase Pro upgrades</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Early access to updates</span>
                </div>
              </div>
              <div className="mt-4">
                <a href={discordLink || 'https://discord.gg/S7PsbJ2e'} target="_blank" rel="noopener noreferrer" className="btn-primary w-full inline-flex items-center justify-center px-4 py-3 rounded-md group">
                  <span className="flex items-center gap-2">
                    Join Discord
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </a>
                <div className="mt-2 text-xs text-center text-slate-500">
                  Server: <span className="text-indigo-300 font-mono">{discordLink ? (() => { try { return new URL(discordLink).pathname.replace('/', '') } catch { return 'Discord' } })() : 'S7PsbJ2e'}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}