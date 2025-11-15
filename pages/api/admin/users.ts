import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase env vars for admin APIs')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
// Create a client with anon key for token validation
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getAdminProfile(req: NextApiRequest) {
  const auth = req.headers.authorization || req.headers.Authorization
  if (!auth || typeof auth !== 'string') return null
  const token = auth.split(' ')[1]
  if (!token) return null

  // Try to validate token with anon client first, then fall back to admin client
  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null
  try {
    const { data } = await supabaseAnon.auth.getUser(token)
    if (data?.user) user = data.user
  } catch {
    // ignore
  }
  if (!user) {
    try {
      const { data } = await supabaseAdmin.auth.getUser(token)
      if (data?.user) user = data.user
    } catch {
      // ignore
    }
  }
  if (!user) return null

  // First check if user has a profile with is_admin = true
  const { data: profile } = await supabaseAdmin.from('profiles').select('id,is_admin').eq('user_id', user.id).maybeSingle()
  if (profile && profile.is_admin) return profile

  // Check admin_emails table
  if (user.email) {
    // case-insensitive match
    const { data: emailRow } = await supabaseAdmin.from('admin_emails').select('email').ilike('email', user.email).maybeSingle()
    if (emailRow) {
      // If user is in admin_emails, ensure they have a profile
      if (!profile) {
        // Create profile for admin user
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert([{ user_id: user.id, is_admin: true, full_name: user.user_metadata?.full_name || null }])
          .select('id,is_admin')
          .single()
        if (createError) {
          console.error('Failed to create admin profile:', createError)
          return null
        }
        return newProfile
      } else {
        // Update existing profile to be admin
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ is_admin: true })
          .eq('user_id', user.id)
          .select('id,is_admin')
          .single()
        if (updateError) {
          console.error('Failed to update admin profile:', updateError)
          return null
        }
        return updatedProfile
      }
    }
  }

  // Check admins table as fallback
  const { data: adminRow } = await supabaseAdmin.from('admins').select('id').eq('id', user.id).maybeSingle()
  if (adminRow) {
    if (!profile) {
      // Create profile for admin user
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert([{ user_id: user.id, is_admin: true, full_name: user.user_metadata?.full_name || null }])
        .select('id,is_admin')
        .single()
      if (createError) {
        console.error('Failed to create admin profile:', createError)
        return null
      }
      return newProfile
    } else {
      // Update existing profile to be admin
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_admin: true })
        .eq('user_id', user.id)
        .select('id,is_admin')
        .single()
      if (updateError) {
        console.error('Failed to update admin profile:', updateError)
        return null
      }
      return updatedProfile
    }
  }

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const profile = await getAdminProfile(req)
    if (!profile) return res.status(403).json({ error: 'Forbidden' })

    if (req.method === 'GET') {
      // List users: combine auth admin list and profiles
      const usersResult = await supabaseAdmin.auth.admin.listUsers()
      if (usersResult.error) return res.status(500).json({ error: usersResult.error.message })
      const users = usersResult.data.users || []

      // Fetch profiles for mapping
      const { data: profiles } = await supabaseAdmin.from('profiles').select('user_id, full_name, is_admin, disabled, last_login, id, quota_limit, banned_until, ban_reason')

      // Fetch usage window rows for profiles
      const profileIds = (profiles || []).map((p: { id?: string }) => p.id).filter(Boolean)
      let usageWindows: Array<Record<string, unknown>> = []
      if (profileIds.length > 0) {
        const { data: uw } = await supabaseAdmin.from('usage_windows').select('user_id, total_used_seconds, max_usage_seconds, window_seconds, window_start').in('user_id', profileIds as string[])
        usageWindows = uw || []
      }

      // Fetch recent usage events for these profiles (limit 100)
      let recentUsage: Array<Record<string, unknown>> = []
      if (profileIds.length > 0) {
        const { data: urows } = await supabaseAdmin.from('usage').select('profile_id, type, amount, meta, created_at').in('profile_id', profileIds as string[]).order('created_at', { ascending: false }).limit(200)
        recentUsage = urows || []
      }

      const merged = users.map((u: { id: string; email?: string; last_sign_in_at?: string; created_at?: string }) => {
        const p = (profiles || []).find((pp: { user_id?: string }) => pp.user_id === u.id) || null
        const uw = p?.id ? (usageWindows || []).find((w: Record<string, unknown>) => w.user_id === p.id) : null
        const recent = (recentUsage || []).filter((r: Record<string, unknown>) => r.profile_id === (p as Record<string, unknown>)?.id).slice(0, 5)
        return {
          id: u.id,
          email: u.email,
          last_sign_in_at: u.last_sign_in_at,
          created_at: u.created_at,
          full_name: p?.full_name,
          profile_id: p?.id,
          is_admin: p?.is_admin || false,
          disabled: p?.disabled || false,
          last_login: p?.last_login || null,
          quota_limit: p?.quota_limit || null,
          usage_window: uw || null,
          recent_usage: recent
        }
      })

      return res.status(200).json({ users: merged })
    }

    if (req.method === 'POST') {
      const { action, target_user_id, reason, until } = req.body
      if (!action || !target_user_id) return res.status(400).json({ error: 'Missing action or target_user_id' })

      if (action === 'ban') {
        // Set banned_until in profiles
        // Ensure profile exists
        const { data: profileRow, error: pErr } = await supabaseAdmin.from('profiles').select('id').eq('user_id', target_user_id).maybeSingle()
        if (pErr) return res.status(500).json({ error: pErr.message })
        if (!profileRow) return res.status(404).json({ error: 'Profile not found' })

        const updates: Record<string, unknown> = {}
        if (until) {
          updates.banned_until = until
        } else {
          // Permanent ban: set to far future
          updates.banned_until = '9999-12-31T23:59:59Z'
        }
        if (reason) updates.ban_reason = reason

        const { error: upErr } = await supabaseAdmin.from('profiles').update(updates).eq('user_id', target_user_id)
        if (upErr) return res.status(500).json({ error: upErr.message })

        await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'ban_user', target_id: profileRow.id, details: { reason, until } }])

        return res.status(200).json({ success: true })
      }

      if (action === 'unban') {
        const { data: profileRow, error: pErr } = await supabaseAdmin.from('profiles').select('id').eq('user_id', target_user_id).maybeSingle()
        if (pErr) return res.status(500).json({ error: pErr.message })
        if (!profileRow) return res.status(404).json({ error: 'Profile not found' })

        const { error: upErr } = await supabaseAdmin.from('profiles').update({ disabled: false, banned_until: null, ban_reason: null }).eq('user_id', target_user_id)
        if (upErr) return res.status(500).json({ error: upErr.message })

        await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'unban_user', target_id: profileRow.id }])

        return res.status(200).json({ success: true })
      }

      if (action === 'delete') {
        // Delete auth user
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(target_user_id)
        if (delErr) return res.status(500).json({ error: delErr.message })

        await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'delete_user', details: { target_user_id } }])

        return res.status(200).json({ success: true })
      }

      // Update quota limit on profiles
      if (action === 'set_quota') {
        const { quota } = req.body
        if (typeof quota !== 'number') return res.status(400).json({ error: 'Missing or invalid quota' })
        const { data: profileRow, error: pErr } = await supabaseAdmin.from('profiles').select('id').eq('user_id', target_user_id).maybeSingle()
        if (pErr) return res.status(500).json({ error: pErr.message })
        if (!profileRow) return res.status(404).json({ error: 'Profile not found' })
        const { error: upErr } = await supabaseAdmin.from('profiles').update({ quota_limit: quota }).eq('user_id', target_user_id)
        if (upErr) return res.status(500).json({ error: upErr.message })
        await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'set_quota', target_id: profileRow.id, details: { quota } }])
        return res.status(200).json({ success: true })
      }

      // Update usage window (max_usage_seconds / window_seconds)
      if (action === 'set_window') {
        const { max_usage_seconds, window_seconds } = req.body
        if (typeof max_usage_seconds !== 'number' || typeof window_seconds !== 'number') return res.status(400).json({ error: 'Missing or invalid parameters' })
        const { data: profileRow, error: pErr } = await supabaseAdmin.from('profiles').select('id').eq('user_id', target_user_id).maybeSingle()
        if (pErr) return res.status(500).json({ error: pErr.message })
        if (!profileRow) return res.status(404).json({ error: 'Profile not found' })
        // Upsert into usage_windows using user_id = profile.id
        const { error: uwErr } = await supabaseAdmin.from('usage_windows').upsert({ user_id: profileRow.id, max_usage_seconds, window_seconds }).select().maybeSingle()
        if (uwErr) return res.status(500).json({ error: uwErr.message })
        await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'set_window', target_id: profileRow.id, details: { max_usage_seconds, window_seconds } }])
        return res.status(200).json({ success: true })
      }

      return res.status(400).json({ error: 'Unknown action' })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: unknown) {
    return res.status(500).json({ error: (err as Error)?.message || 'Server error' })
  }
}
