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

async function getUserFromBearer(req: NextApiRequest) {
  const auth = req.headers.authorization || req.headers.Authorization
  if (!auth || typeof auth !== 'string') return null
  const token = auth.split(' ')[1]
  if (!token) return null
  // Try to get user from JWT token using anon key client first.
  // If that fails (some token types require a service role check), fall back to the admin client.
  const attempts: any = { anon: { ok: false, error: null }, admin: { ok: false, error: null } }
  let user: any = null

  try {
    const { data, error } = await supabaseAnon.auth.getUser(token)
    if (error) attempts.anon.error = String(error.message || error)
    if (data?.user) {
      attempts.anon.ok = true
      user = data.user
    }
  } catch (err: any) {
    attempts.anon.error = String(err?.message || err)
  }

  if (!user) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      if (error) attempts.admin.error = String(error.message || error)
      if (data?.user) {
        attempts.admin.ok = true
        user = data.user
      }
    } catch (err: any) {
      attempts.admin.error = String(err?.message || err)
    }
  }

  return { user, attempts }
}

async function getAdminInfoForUserToken(req: NextApiRequest) {
  const debug: any = { foundUser: false, byProfile: false, byEmail: false, byAdminsTable: false, resolvedBy: null }
  const gb = await getUserFromBearer(req)
  const user = gb?.user || null
  const attempts = gb?.attempts || { anon: { ok: false }, admin: { ok: false } }
  debug.anon = attempts.anon
  debug.adminClient = attempts.admin
  if (!user) return { isAdmin: false, profile: null, debug }
  debug.foundUser = true
  debug.userId = user.id
  debug.userEmail = user.email || null
  debug.resolvedBy = attempts.anon?.ok ? 'anon' : attempts.admin?.ok ? 'admin' : null

  // Quick path: check admin_emails (case-insensitive) first — most reliable source
  if (user.email) {
    const { data: emailRow } = await supabaseAdmin
      .from('admin_emails')
      .select('email')
      .ilike('email', user.email)
      .maybeSingle()
    if (emailRow) {
      debug.byEmail = true
      return { isAdmin: true, profile: null, debug }
    }
  }

  // Check profiles table next
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id,full_name,is_admin')
    .eq('user_id', user.id)
    .maybeSingle()
  if (profile && profile.is_admin) {
    debug.byProfile = true
    return { isAdmin: true, profile, debug }
  }

  // check admins table (may reference auth.users.id)
  const { data: adminRow } = await supabaseAdmin
    .from('admins')
    .select('id,email')
    .eq('id', user.id)
    .maybeSingle()
  if (adminRow) {
    debug.byAdminsTable = true
    return { isAdmin: true, profile, debug }
  }

  return { isAdmin: false, profile, debug }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Prevent caching for this sensitive endpoint — ensure clients always get a fresh decision
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    const { isAdmin, profile } = await getAdminInfoForUserToken(req)
    const result: any = { isAdmin: !!isAdmin }
    if (profile) result.profile = profile
    // Never return debug details - they could leak sensitive user information
    return res.status(200).json(result)
  } catch (err: any) {
    console.error('admin/check error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
