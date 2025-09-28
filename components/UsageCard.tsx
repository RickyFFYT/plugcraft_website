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

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.debug('[UsageCard] fetchData start', { userId: user?.id })
      // Fetch the user's profile to get the profile_id and quota_limit
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, quota_limit')
        .eq('user_id', user!.id)
        .maybeSingle()

      let activeProfile = profileData

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
    } catch (err: any) {
      console.error('[UsageCard] Error loading profile/usage:', err)
      setError(err?.message || 'Failed to load usage')
      setProfile(null)
      setUsage([])
      setTotalUsed(0)
    } finally {
      console.debug('[UsageCard] fetchData finished')
      setIsLoading(false)
    }
  }

  if (isLoading) return (
    <div className="glass-card p-6 flex items-center justify-center min-h-[120px] animate-pulse" aria-busy="true" aria-label="Loading usage">
      <span className="text-slate-300">Loading usage...</span>
    </div>
  )

  if (error) return (
    <div className="glass-card p-6 min-h-[120px]" role="alert">
      <p className="text-rose-200">{error}</p>
      <button onClick={fetchData} className="mt-3 text-sm text-indigo-200">Retry</button>
    </div>
  )

  if (!profile) return (
    <div className="glass-card p-6 min-h-[120px]">
      <p className="text-slate-300">No profile found.</p>
      <button onClick={fetchData} className="mt-3 text-sm text-indigo-200">Create profile</button>
    </div>
  )

  const quota = profile.quota_limit || 1
  const percentage = (totalUsed / quota) * 100

  return (
    <section className="glass-card p-8 border border-blue-400/20 shadow-lg animate-fade-in-up" aria-labelledby="usage-title">
      <h3 id="usage-title" className="text-lg font-bold text-white flex items-center gap-2 mb-2">
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" stroke="#60A5FA" strokeWidth="2" fill="#1e293b"/><path d="M10 5v5l3 3" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Usage
      </h3>
      <div className="flex items-center gap-4 mb-3">
        <span className="text-2xl font-semibold text-blue-200" aria-label="Used quota">{totalUsed}</span>
        <span className="text-slate-400">/</span>
        <span className="text-lg text-slate-200" aria-label="Quota limit">{profile.quota_limit}</span>
      </div>
      <div className="w-full bg-slate-800/60 rounded-full h-3 mb-2 relative" role="progressbar" aria-valuenow={totalUsed} aria-valuemax={profile.quota_limit} aria-label="Usage progress">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 h-3 rounded-full transition-all duration-700" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-300">{Math.round(percentage)}%</span>
      </div>
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
