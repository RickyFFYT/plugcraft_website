import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { extractErrorMessage } from '../../../lib/utils'

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

  // Use anon key client for token validation
  const { data, error } = await supabaseAnon.auth.getUser(token)
  if (error || !data?.user) return null
  const user = data.user

  // Check profiles table first
  const { data: profile } = await supabaseAdmin.from('profiles').select('id,is_admin').eq('user_id', user.id).maybeSingle()
  if (profile && profile.is_admin) return profile

  // Fallback to admin_emails
  if (user.email) {
    const { data: emailRow } = await supabaseAdmin.from('admin_emails').select('email').eq('email', user.email).maybeSingle()
    if (emailRow) return profile || { id: null, is_admin: true }
  }

  // Fallback to admins table
  const { data: adminRow } = await supabaseAdmin.from('admins').select('id').eq('id', user.id).maybeSingle()
  if (adminRow) return profile || { id: null, is_admin: true }

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Public: return currently active announcements (client-facing)
      const now = new Date().toISOString()
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return res.status(500).json({ error: error.message })

      // Filter active announcements
      type AnnouncementRow = { id?: number | string; title?: string; body?: string; starts_at?: string | null; ends_at?: string | null }
      const active = (data || []).filter((a: AnnouncementRow) => {
        const starts = a.starts_at ? new Date(a.starts_at).toISOString() <= now : true
        const ends = a.ends_at ? new Date(a.ends_at).toISOString() > now : true
        return starts && ends
      })

      return res.status(200).json({ announcements: active })
    }

    // All other methods require admin
    const profile = await getAdminProfile(req)
    if (!profile) return res.status(403).json({ error: 'Forbidden' })

    if (req.method === 'POST') {
      const { title, body, starts_at, ends_at } = req.body
      if (!title || !body) return res.status(400).json({ error: 'Missing title or body' })

      const { data, error } = await supabaseAdmin.from('announcements').insert([
        { title, body, starts_at: starts_at || null, ends_at: ends_at || null, created_by: profile.id }
      ]).select().single()

      if (error) return res.status(500).json({ error: error.message })

      // record admin audit
      await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'create_announcement', target_id: data.id, details: { title } }])

      return res.status(201).json({ announcement: data })
    }

    if (req.method === 'PUT') {
      const { id, title, body, starts_at, ends_at } = req.body
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const updates: Record<string, unknown> = {}
      if (title !== undefined) updates.title = title
      if (body !== undefined) updates.body = body
      if (starts_at !== undefined) updates.starts_at = starts_at
      if (ends_at !== undefined) updates.ends_at = ends_at

      const { data, error } = await supabaseAdmin.from('announcements').update(updates).eq('id', id).select().maybeSingle()
      if (error) return res.status(500).json({ error: error.message })

      await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'update_announcement', target_id: id, details: updates }])

      return res.status(200).json({ announcement: data })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id)
      if (error) return res.status(500).json({ error: error.message })

      await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'delete_announcement', target_id: id }])

      return res.status(204).end()
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: unknown) {
    const msg = extractErrorMessage(err)
    return res.status(500).json({ error: msg || 'Server error' })
  }
}
