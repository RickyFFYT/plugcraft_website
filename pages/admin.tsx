import { useEffect, useState } from 'react'
import Head from 'next/head'
import ProtectedRoute from '../components/ProtectedRoute'
import { useSession, useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { AdminTabs, AdminAnnouncements, AdminUsers, AdminSettings, AdminReleases, AdminQuotas } from '../components/admin'

interface Announcement {
  id: string
  title: string
  body: string
  starts_at?: string
  ends_at?: string
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <Head>
        <title>Admin Panel — Plugcraft</title>
      </Head>
      <AdminContent />
    </ProtectedRoute>
  )
}

function AdminContent() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const user = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [serverCheckWarning, setServerCheckWarning] = useState<string | null>(null)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])

  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '', starts_at: '', ends_at: '' })

  // Move tabs and activeTab hook here so hooks are called unconditionally
  const tabs = [
    { id: 'announcements', label: 'Announcements' },
    { id: 'users', label: 'Users' },
    { id: 'settings', label: 'Settings' },
    { id: 'releases', label: 'Releases' },
    { id: 'quotas', label: 'Quotas' },
  ]

  const [activeTab, setActiveTab] = useState(tabs[0].id)

  useEffect(() => {
    if (!session) {
      console.log('[AdminContent] No session, skipping admin check')
      return
    }
    ;(async () => {
      setLoading(true)
      try {
        console.log('[AdminContent] Starting admin check with session:', session)
        // Authoritative server-side admin check. Always call server API rather than relying on
        // client-side table queries to avoid exposing DB to the browser or depending on client keys.
        let token = (session as any)?.access_token
        if (!token) {
          const s = await supabase.auth.getSession()
          token = (s as any)?.data?.session?.access_token
        }
        console.log('[AdminContent] Token extracted:', token ? 'YES (length=' + token.length + ')' : 'NO')

        const res = await fetch('/api/admin/check', { method: 'GET', cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
        console.log('[AdminContent] /api/admin/check response status:', res.status)
        const j = await res.json()
        console.log('[AdminContent] /api/admin/check response body:', j)
        if (!res.ok || !j.isAdmin) {
          setIsAdmin(false)
          // In development show debug info; in prod just redirect to dashboard
          if (j?.debug && process.env.NODE_ENV !== 'production') {
            console.warn('Server admin check failed — debug:', j.debug)
            alert(`Admin check failed — debug info: ${JSON.stringify(j.debug)}`)
            return
          }
          console.log('[AdminContent] Not admin, redirecting to /dashboard')
          window.location.href = '/dashboard'
          return
        }

        console.log('[AdminContent] Admin check passed! Loading admin data...')
        setIsAdmin(true)
        setServerCheckWarning(null)
        await loadAll(token || '')
        console.log('[AdminContent] Admin data loaded successfully')
      } catch (e) {
        console.error('[AdminContent] Error during admin check:', e)
      } finally {
        setLoading(false)
        console.log('[AdminContent] Loading finished, isAdmin state updated')
      }
    })()
  }, [session])

  async function loadAll(token: string) {
    // Load all announcements (admin can see all)
    const annRes = await fetch('/api/admin/announcements', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
    const annJ = await annRes.json()
    if (annRes.ok) setAnnouncements(annJ.announcements || [])

    const usersRes = await fetch('/api/admin/users', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
    const usersJ = await usersRes.json()
    if (usersRes.ok) setUsers(usersJ.users || [])

    const settingsRes = await fetch('/api/admin/settings', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
    const settingsJ = await settingsRes.json()
    if (settingsRes.ok) setSettings(settingsJ.settings || [])
  }

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    const token = session.access_token
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newAnnouncement)
    })
    if (res.ok) {
      setNewAnnouncement({ title: '', body: '', starts_at: '', ends_at: '' })
      await loadAll(token)
    } else {
      const j = await res.json().catch(() => ({ error: 'Unknown' }))
      alert('Failed to create announcement: ' + (j.error || 'unknown'))
    }
  }

  async function performUserAction(action: string, target_user_id: string, extra?: any) {
    if (!session) return
    const token = session.access_token
    const body: any = { action, target_user_id }
    if (action === 'ban') {
      const reason = extra?.reason ?? prompt('Reason for ban (optional)')
      const until = extra?.until ?? prompt('Ban until (ISO timestamp, optional)')
      body.reason = reason
      body.until = until
    }

    if (action === 'set_quota') {
      // extra: { quota: number }
      body.quota = extra?.quota
    }

    if (action === 'set_window') {
      // extra: { max_usage_seconds, window_seconds }
      body.max_usage_seconds = extra?.max_usage_seconds
      body.window_seconds = extra?.window_seconds
    }

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    })
    if (res.ok) {
      await loadAll(token)
    } else {
      const j = await res.json().catch(() => ({ error: 'Unknown' }))
      alert('Action failed: ' + (j.error || 'unknown'))
    }
  }

  async function toggleLock() {
    if (!session) return
    const token = session.access_token
    const current = settings.find((s: any) => s.key === 'software_locked')
    const newValue = { value: !(current?.value?.value || false) }
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key: 'software_locked', value: newValue })
    })
    if (res.ok) {
      await loadAll(token)
    } else {
      alert('Failed to toggle lock')
    }
  }

  if (loading) return <div className="p-8 text-white">Loading admin panel...</div>

  if (!isAdmin) return <div className="p-8 text-white">Checking admin access...</div>

  // handlers that call existing logic
  const handleEditAnnouncement = async (id: string, newBody: string) => {
    const token = session!.access_token
    await fetch('/api/admin/announcements', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, body: newBody }) })
    await loadAll(token)
  }

  const handleDeleteAnnouncement = async (id: string) => {
    const token = session!.access_token
    await fetch('/api/admin/announcements', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
    await loadAll(token)
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    await createAnnouncement(e)
  }

  const handleUserAction = async (action: string, userId: string) => {
    // Allow passing structured payload via a specially formatted action string or via overload
    // If action contains a JSON payload it will be ignored here — AdminUsers will call performUserAction directly
    await performUserAction(action, userId)
  }
  
  // Exposed to quota tab to update global defaults
  async function saveSetting(key: string, value: any) {
    if (!session) return
    const token = session.access_token
    const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ key, value }) })
    if (!res.ok) throw new Error('Failed to save setting')
    await loadAll(token)
  }

  async function saveRelease(value: any) {
    // Use session token to authorize
    let token = (session as any)?.access_token
    if (!token) {
      const s = await supabase.auth.getSession()
      token = (s as any)?.data?.session?.access_token
    }
    if (!token) throw new Error('Missing token')

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key: 'latest_release', value })
    })
    if (!res.ok) throw new Error('Failed to save release')
    // reload settings
    await loadAll(token)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
  <div className="glass-panel mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-4">
            <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin Control Center
          </h1>
          <p className="text-lg text-slate-300">Manage users, content, and system settings with precision and elegance.</p>
          {serverCheckWarning && (
            <div className="mt-6 p-4 rounded-2xl bg-yellow-900/30 border border-yellow-700/50 text-yellow-100 flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {serverCheckWarning}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <AdminTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <div className="transition-all duration-500 ease-out">
            {activeTab === 'announcements' && (
              <AdminAnnouncements
                announcements={announcements}
                newAnnouncement={newAnnouncement}
                onChangeNew={(n) => setNewAnnouncement(n)}
                onCreate={handleCreateAnnouncement}
                onEdit={handleEditAnnouncement}
                onDelete={handleDeleteAnnouncement}
              />
            )}

            {activeTab === 'users' && (
              <AdminUsers users={users} onAction={(a, id, extra) => performUserAction(a, id, extra)} />
            )}

            {activeTab === 'releases' && (
              <AdminReleases settings={settings} onSave={async (v) => { try { await saveRelease(v) } catch (e) { console.error(e); alert('Save failed') } }} />
            )}

            {activeTab === 'settings' && (
              <AdminSettings settings={settings} onToggleLock={toggleLock} onSave={saveSetting} />
            )}

            {activeTab === 'quotas' && (
              <AdminQuotas settings={settings} onSave={async (k, v) => { try { await saveSetting(k, v) } catch (e) { console.error(e); alert('Failed to save') } }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
