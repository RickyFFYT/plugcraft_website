import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { setSecurityHeaders, extractBearerToken, validateRequestSize } from '../../../lib/security-headers'
import { getEnvVars } from '../../../lib/env-validation'

async function getAdminProfile(req: NextApiRequest, supabaseAdmin: any, supabaseAnon: any) {
  const token = extractBearerToken(req.headers.authorization)
  if (!token) return null

  // Use anon key client for token validation
  const { data, error } = await supabaseAnon.auth.getUser(token)
  if (error || !data?.user) return null
  const user = data.user

  const { data: profile } = await supabaseAdmin.from('profiles').select('id,is_admin').eq('user_id', user.id).maybeSingle()
  if (profile && profile.is_admin) return profile

  if (user.email) {
    const { data: emailRow } = await supabaseAdmin.from('admin_emails').select('email').ilike('email', user.email).maybeSingle()
    if (emailRow) return profile || { id: null, is_admin: true }
  }

  const { data: adminRow } = await supabaseAdmin.from('admins').select('id').eq('id', user.id).maybeSingle()
  if (adminRow) return profile || { id: null, is_admin: true }

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set security headers
  setSecurityHeaders(res)
  
  const env = getEnvVars()
  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseAnon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    if (req.method === 'GET') {
      // Public settings endpoint - but use RLS to control what's visible
      const { data, error } = await supabaseAnon.from('site_settings').select('*')
      if (error) {
        return res.status(500).json({ error: 'Failed to fetch settings' })
      }
      return res.status(200).json({ settings: data })
    }

    // For POST/PUT/DELETE, require admin authentication
    const profile = await getAdminProfile(req, supabaseAdmin, supabaseAnon)
    if (!profile) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.method === 'POST') {
      // Validate request size
      if (!validateRequestSize(req.body, 100)) {
        return res.status(413).json({ error: 'Request too large' })
      }

      const { key, value } = req.body
      if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Valid key is required' })
      }

      // Upsert
      const { data, error } = await supabaseAdmin.from('site_settings').upsert({ key, value }).select().maybeSingle()
      if (error) {
        return res.status(500).json({ error: 'Failed to update setting' })
      }

      await supabaseAdmin.from('admin_audit').insert([{ admin_id: profile.id, action: 'update_setting', details: { key, value } }])

      return res.status(200).json({ setting: data })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err: any) {
    console.error('admin/settings error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
