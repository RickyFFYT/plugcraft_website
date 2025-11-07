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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4 mb-3 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
              {profileName ? profileName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-white drop-shadow animate-fade-in-up leading-tight break-words">Welcome back{profileName ? `, ${profileName}` : ''}!</h1>
              <p className="mt-1 text-sm sm:text-base text-slate-300 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl">
            Monitor your Ghosted usage, download the latest build, and keep track of your account status.
          </p>
        </div>
  <div className="glass-card glass-panel px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-200 shadow-lg w-full lg:w-auto lg:min-w-[200px]" aria-label="Account details">
    <div className="animate-fade-in-up delay-200">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="font-semibold text-white">Account Status</p>
      </div>
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Free Plan
        </span>
      </div>
      {isAdmin && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Panel
          </Link>
        </div>
      )}
    </div>
  </div>
      </div>

      <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 sm:space-y-8">
          <section className="glass-card glass-panel p-6 sm:p-8 shadow-2xl border border-indigo-500/30" aria-labelledby="download-title">
            <div className="animate-fade-in-up">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-4">
                <h2 id="download-title" className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" className="sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v14m0 0l-4-4m4 4l4-4" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="17" width="16" height="4" rx="2" fill="#818CF8" fillOpacity=".12"/></svg>
                  </div>
                  <span className="leading-tight">Download Ghosted</span>
                </h2>
                {latestRelease?.version && (
                  <span className="px-2 sm:px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs sm:text-sm font-semibold flex-shrink-0">
                    {latestRelease.version}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 sm:mb-6">
                Get the latest build with cutting-edge features. Secure signed link expires in 1 hour.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href={getDownloadUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 sm:gap-3 rounded-lg btn-primary py-3 sm:py-4 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all touch-manipulation min-h-[52px]"
                  aria-label="Download latest build"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {isLoadingSettings ? 'Loading...' : 'Download Now'}
                </a>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="whitespace-nowrap">Virus scanned</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="whitespace-nowrap">Secure download</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="whitespace-nowrap">Updated recently</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card glass-panel p-8 shadow-2xl border border-white/10" aria-labelledby="announcements-title">
            <div className="animate-fade-in-up delay-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h2 id="announcements-title" className="text-xl font-bold text-white">Latest Announcements</h2>
              </div>
              <div className="mt-4">
                 {isLoadingAnnouncements ? (
                   <div className="space-y-3">
                     <div className="animate-pulse p-4 rounded-lg bg-white/5">
                       <div className="h-4 bg-white/10 rounded mb-2 w-3/4"></div>
                       <div className="h-3 bg-white/10 rounded w-full"></div>
                       <div className="h-3 bg-white/10 rounded w-5/6 mt-1"></div>
                     </div>
                     <div className="animate-pulse p-4 rounded-lg bg-white/5">
                       <div className="h-4 bg-white/10 rounded mb-2 w-2/3"></div>
                       <div className="h-3 bg-white/10 rounded w-full"></div>
                     </div>
                   </div>
                 ) : announcementsList.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400">No announcements at this time</p>
                  </div>
                 ) : (
                   <ul className="space-y-3">
                     {announcementsList.map((a: any) => (
                      <li key={a.id} className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="text-lg font-semibold text-white leading-tight mb-2">{a.title}</div>
                            <div className="text-sm text-slate-300 leading-relaxed">{a.body}</div>
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
          <section className="glass-card glass-panel p-6 shadow-2xl border border-white/10 text-sm text-slate-300">
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-semibold text-white">Join our Discord</h2>
              <p className="mt-2 text-slate-300">For support, purchases, and community — join our official Discord server.</p>
              <div className="mt-4 flex gap-3">
                <a href={discordLink || 'https://discord.gg/S7PsbJ2e'} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center px-4 py-2 rounded-md">Join Discord</a>
                <a href={discordLink || 'https://discord.gg/S7PsbJ2e'} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center px-4 py-2 rounded-md">{discordLink ? (() => { try { return new URL(discordLink).pathname.replace('/', '') } catch { return 'Discord' } })() : 'S7PsbJ2e'}</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}