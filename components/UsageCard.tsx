import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '@supabase/auth-helpers-react'

interface Profile {
  id: string
  quota_limit: number
}

interface Usage {
  amount: number
  created_at: string
}

export default function UsageCard() {
  const user = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [usage, setUsage] = useState<Usage[]>([])
  const [totalUsed, setTotalUsed] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [windowInfo, setWindowInfo] = useState<{
    total_used_seconds: number
    max_usage_seconds: number
    window_start: string | null
    window_seconds: number
    paused_seconds?: number | null
  } | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Realtime subscription: listen for changes to usage_windows and new usage_sessions for the user
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel(`usage_updates_user_${user.id}`)
    // Listen for changes to the precomputed window row
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'usage_windows', filter: `user_id=eq.${user.id}` }, (payload) => {
      try {
        if (payload.eventType === 'DELETE') {
          setWindowInfo(null)
          return
        }
        const newRow = payload.new as { total_used_seconds?: number; max_usage_seconds?: number; window_start?: string; window_seconds?: number; paused_seconds?: number }
        if (newRow) {
          setWindowInfo(newRow as { total_used_seconds: number; max_usage_seconds: number; window_start: string | null; window_seconds: number; paused_seconds?: number | null })
          if (newRow.window_start) {
            const start = new Date(newRow.window_start).getTime()
            const end = start + (Number(newRow.window_seconds || 0) * 1000)
            setTimeLeft(Math.max(0, Math.round((end - Date.now()) / 1000)))
          } else {
            setTimeLeft(null)
          }
        }
      } catch {
        // swallow
      }
    })
    // Also listen for new usage_sessions to refresh the total or timeline
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'usage_sessions', filter: `user_id=eq.${user.id}` }, () => {
      // On new sessions, refresh the precomputed window info
      fetchData()
    })

    channel.subscribe()
    return () => {
      try { supabase.removeChannel(channel) } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Refresh on window focus so user returns see fresh values
  useEffect(() => {
    if (!user) return
    const onFocus = () => fetchData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.debug('[UsageCard] fetchData start', { userId: user?.id })
      // Fetch the user's profile to get the profile_id and quota_limit
      // Try to fetch a single profile. If multiple profiles exist (data integrity
      // issue) prefer the first row to avoid throwing a JSON object error in the
      // client. This keeps the UI resilient while you fix duplicates server-side.
      const { data: profileDataRaw, error: profileError } = await supabase
        .from('profiles')
        .select('id, quota_limit')
        .eq('user_id', user!.id)
        .limit(1)

      let activeProfile = Array.isArray(profileDataRaw) ? profileDataRaw[0] : profileDataRaw

      // If profile doesn't exist, create one (upsert)
      if (profileError) {
        // log and continue to attempt safe upsert
        console.warn('Profile select error, attempting upsert:', profileError.message)
      }

      if (!activeProfile) {
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .upsert({ user_id: user!.id, quota_limit: 100 })
          .select('id, quota_limit')
          .maybeSingle()

        if (createError || !created) {
          console.error('[UsageCard] failed creating profile', createError)
          throw new Error(createError?.message || 'Failed to create profile')
        }

        activeProfile = created
      }

      console.debug('[UsageCard] activeProfile', activeProfile)
      setProfile(activeProfile)

      // Fetch usage from the 'usage' table using the profile_id
      const { data: usageData, error: usageError } = await supabase
        .from('usage')
        .select('amount, created_at')
        .eq('profile_id', activeProfile.id)
        .order('created_at', { ascending: false })

      if (usageError) {
        console.error('[UsageCard] usageError', usageError)
        throw usageError
      }

      const rows = usageData || []
      setUsage(rows)
      setTotalUsed(rows.reduce((sum, u) => sum + (u.amount || 0), 0))

      // Also attempt to fetch the precomputed rolling window (15min / 5h) if available
      try {
        const { data: windowData, error: windowError } = await supabase
          .from('usage_windows')
          .select('total_used_seconds, max_usage_seconds, window_start, window_seconds, paused_seconds')
          .eq('user_id', user!.id)
          .maybeSingle()

        if (windowError) {
          console.debug('[UsageCard] usage_windows fetch error', windowError)
        } else if (windowData) {
          setWindowInfo({
            total_used_seconds: windowData.total_used_seconds ?? 0,
            max_usage_seconds: windowData.max_usage_seconds ?? 0,
            window_start: windowData.window_start ?? null,
            window_seconds: windowData.window_seconds ?? 0,
            paused_seconds: windowData.paused_seconds ?? null
          })
          // compute initial timeLeft if window has a start
          if (windowData?.window_start) {
            const start = new Date(windowData.window_start).getTime()
            const end = start + (Number(windowData.window_seconds || 0) * 1000)
            setTimeLeft(Math.max(0, Math.round((end - Date.now()) / 1000)))
          } else {
            setTimeLeft(null)
          }
        }
      } catch (e) {
        console.debug('[UsageCard] unexpected error fetching usage_windows', e)
      }
    } catch (err: unknown) {
      console.error('[UsageCard] Error loading profile/usage:', err)
      setError((err as Error)?.message || 'Failed to load usage')
      setProfile(null)
      setUsage([])
      setTotalUsed(0)
    } finally {
      console.debug('[UsageCard] fetchData finished')
      setIsLoading(false)
    }
  }

  // Countdown updater for window expiry
  useEffect(() => {
    if (!windowInfo || !windowInfo.window_start) return
    const timer = setInterval(() => {
      const start = new Date(windowInfo.window_start!).getTime()
      const end = start + (Number(windowInfo.window_seconds || 0) * 1000)
      const secs = Math.max(0, Math.round((end - Date.now()) / 1000))
      setTimeLeft(secs)
    }, 1000)
    return () => clearInterval(timer)
  }, [windowInfo])

  if (isLoading) return (
    <div className="glass-card force-sheen p-6 flex items-center justify-center min-h-[120px] animate-pulse" aria-busy="true" aria-label="Loading usage">
      <span className="text-slate-300">Loading usage...</span>
    </div>
  )

  if (error) return (
    <div className="glass-card force-sheen p-6 min-h-[120px]" role="alert">
      <p className="text-rose-200">{error}</p>
      <button onClick={fetchData} className="mt-3 text-sm text-indigo-200">Retry</button>
    </div>
  )

  if (!profile) return (
    <div className="glass-card force-sheen p-6 min-h-[120px]">
      <p className="text-slate-300">No profile found.</p>
      <button onClick={fetchData} className="mt-3 text-sm text-indigo-200">Create profile</button>
    </div>
  )

  const quota = profile.quota_limit || 1
  const percentage = (totalUsed / quota) * 100

  // If windowInfo is available, show time-based usage (seconds) and percent of the allowed window
  // If the window has expired (client-side check), display 0 immediately so users see 0/15 even before server pruning completes
  const nowMs = Date.now()
  const windowStartedAt = windowInfo && windowInfo.window_start ? new Date(windowInfo.window_start).getTime() : null
  const windowSecondsVal = windowInfo ? Number(windowInfo.window_seconds || 0) : 0
  const isWindowExpired = windowStartedAt ? (nowMs - windowStartedAt) >= (windowSecondsVal * 1000) : false
  const usedSeconds = isWindowExpired ? 0 : (windowInfo ? Number(windowInfo.total_used_seconds || 0) : 0)
  const maxSeconds = windowInfo ? Number(windowInfo.max_usage_seconds || 900) : 0
  const windowPercentage = maxSeconds > 0 ? (usedSeconds / maxSeconds) * 100 : 0
  const minutesUsed = Math.round(usedSeconds / 60)
  const minutesMax = Math.round(maxSeconds / 60)

  return (
    <section className="glass-card force-sheen p-8 border border-blue-400/20 shadow-lg animate-fade-in-up" aria-labelledby="usage-title">
      <h3 id="usage-title" className="text-lg font-bold text-white flex items-center gap-2 mb-2">
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" stroke="#60A5FA" strokeWidth="2" fill="#1e293b"/><path d="M10 5v5l3 3" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Usage
        <button onClick={fetchData} className="ml-auto text-sm text-slate-300 hover:text-white focus:outline-none" aria-label="Refresh usage">Refresh</button>
      </h3>
      {windowInfo ? (
        <>
          <div className="flex items-center gap-4 mb-3">
            <div>
              <div className="text-2xl font-semibold text-blue-200" aria-label="Used seconds display">{minutesUsed}</div>
              <div className="text-xs text-slate-400">minutes used</div>
            </div>
            <div className="mx-2 text-slate-400">/</div>
            <div>
              <div className="text-lg text-slate-200" aria-label="Window max minutes">{minutesMax} min</div>
              <div className="text-xs text-slate-400">window length</div>
            </div>
            <div className="ml-auto text-sm text-slate-300">
              {windowInfo.window_start ? (
                isWindowExpired ? (
                  <div className="text-yellow-300">Window expired — reset to 0</div>
                ) : (
                  <div>
                    <div>Window started: <span className="font-medium">{new Date(windowInfo.window_start).toLocaleString()}</span></div>
                    <div>Resets in: <span className="font-medium">{timeLeft === null ? '—' : `${Math.floor((timeLeft||0)/60)}m ${((timeLeft||0)%60)}s`}</span></div>
                  </div>
                )
              ) : (
                <div className="text-slate-400">Window not started yet</div>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-800/60 rounded-full h-3 mb-2 relative" role="progressbar" aria-valuenow={usedSeconds} aria-valuemax={maxSeconds} aria-label="Usage progress">
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 h-3 rounded-full transition-all duration-700" style={{ width: `${Math.min(windowPercentage, 100)}%` }}></div>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-300">{Math.round(windowPercentage)}%</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-2xl font-semibold text-blue-200" aria-label="Used quota">{totalUsed}</span>
            <span className="text-slate-400">/</span>
            <span className="text-lg text-slate-200" aria-label="Quota limit">{profile.quota_limit}</span>
          </div>
          <div className="w-full bg-slate-800/60 rounded-full h-3 mb-2 relative" role="progressbar" aria-valuenow={totalUsed} aria-valuemax={profile.quota_limit} aria-label="Usage progress">
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 h-3 rounded-full transition-all duration-700" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-300">{Math.round(percentage)}%</span>
          </div>
        </>
      )}
      <ul className="mt-4 space-y-1 text-slate-300 text-sm" aria-label="Recent usage entries">
        {usage.slice(0, 5).map((u, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
            <span>{u.amount}</span>
            <span className="ml-2 text-xs text-slate-400">{new Date(u.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
