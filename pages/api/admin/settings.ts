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

  // Use anon key client for token validation
  const { data, error } = await supabaseAnon.auth.getUser(token)
  if (error || !data?.user) return null
  const user = data.user

  const { data: profile } = await supabaseAdmin.from('profiles').select('id,is_admin').eq('user_id', user.id).maybeSingle()
  if (profile && profile.is_admin) return profile

  if (user.email) {
    const { data: emailRow } = await supabaseAdmin.from('admin_emails').select('email').eq('email', user.email).maybeSingle()
    if (emailRow) return profile || { id: null, is_admin: true }
  }

  const { data: adminRow } = await supabaseAdmin.from('admins').select('id').eq('id', user.id).maybeSingle()
  if (adminRow) return profile || { id: null, is_admin: true }

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('site_settings').select('*')
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ settings: data })
    }

    const profile = await getAdminProfile(req)
    if (!profile) return res.status(403).json({ error: 'Forbidden' })

    if (req.method === 'POST') {
      const { key, value } = req.body
      if (!key) return res.status(400).json({ error: 'Missing key' })

      // Upsert
      const { data, error } = await supabaseAdmin.from('site_settings').upsert({ key, value }).select().maybeSingle()
      if (error) return res.status(500).json({ error: error.message })

      await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'update_setting', details: { key, value } }])

      return res.status(200).json({ setting: data })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error' })
  }
}
