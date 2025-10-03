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
    if (!session) return
    ;(async () => {
      setLoading(true)
      try {
        // Try client-side checks first to avoid cached API 304s and speed up UX.
        const userId = (session as any)?.user?.id
        const userEmail = (session as any)?.user?.email
        let foundAdmin = false

        if (userId) {
          try {
            const { data: profileRow, error } = await supabase.from('profiles').select('is_admin').eq('user_id', userId).maybeSingle()
            if (!error && profileRow?.is_admin) {
              foundAdmin = true
            }
          } catch (e) {
            // ignore
          }
        }

        if (!foundAdmin && userEmail) {
          try {
            const { data: emailRow } = await supabase.from('admin_emails').select('email').eq('email', userEmail).maybeSingle()
            if (emailRow) {
              foundAdmin = true
            }
          } catch (e) {
            // ignore
          }
        }

        if (foundAdmin) {
          // Use access token if available for later server calls; fall back to session retrieval
          let token = (session as any)?.access_token
          if (!token) {
            const s = await supabase.auth.getSession()
            token = (s as any)?.data?.session?.access_token
          }
          setIsAdmin(true)
          setServerCheckWarning(null)
          await loadAll(token || '')
          return
        }

        // Client-side checks didn't confirm admin — call server endpoint without caching to get authoritative decision
        let token = (session as any)?.access_token
        if (!token) {
          const s = await supabase.auth.getSession()
          token = (s as any)?.data?.session?.access_token
        }
        const res = await fetch('/api/admin/check', { method: 'GET', cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
        const j = await res.json()
        if (!res.ok || !j.isAdmin) {
          setIsAdmin(false)
          if (j?.debug && process.env.NODE_ENV !== 'production') {
            console.warn('Server admin check failed — debug:', j.debug)
            // provide helpful info in dev for diagnostics and avoid blind redirect
            alert(`Admin check failed — debug info: ${JSON.stringify(j.debug)}`)
            return
          }
          window.location.href = '/dashboard'
          return
        }

        setIsAdmin(true)
        setServerCheckWarning(null)
        await loadAll(token || '')
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [session])

  async function loadAll(token: string) {
    // Load all announcements (admin can see all)
    const annRes = await fetch('/api/admin/announcements', { headers: { Authorization: `Bearer ${token}` } })
    const annJ = await annRes.json()
    if (annRes.ok) setAnnouncements(annJ.announcements || [])

    const usersRes = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
    const usersJ = await usersRes.json()
    if (usersRes.ok) setUsers(usersJ.users || [])

    const settingsRes = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
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

  if (loading) return <div className="p-8">Loading admin panel...</div>

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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
      {serverCheckWarning && (
        <div className="mt-4 p-3 rounded bg-yellow-900/40 border border-yellow-700 text-yellow-100">{serverCheckWarning}</div>
      )}

      <div className="mt-6">
        <AdminTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
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
            <AdminSettings settings={settings} onToggleLock={toggleLock} />
          )}

          {activeTab === 'quotas' && (
            <AdminQuotas settings={settings} onSave={async (k, v) => { try { await saveSetting(k, v) } catch (e) { console.error(e); alert('Failed to save') } }} />
          )}
        </div>
      </div>
    </div>
  )
}
