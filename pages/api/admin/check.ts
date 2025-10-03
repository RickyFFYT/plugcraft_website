import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env vars for admin APIs')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function getUserFromBearer(req: NextApiRequest) {
  const auth = req.headers.authorization || req.headers.Authorization
  if (!auth || typeof auth !== 'string') return null
  const token = auth.split(' ')[1]
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

async function getAdminInfoForUserToken(req: NextApiRequest) {
  const debug: any = { foundUser: false, byProfile: false, byEmail: false, byAdminsTable: false }
  const user = await getUserFromBearer(req)
  if (!user) return { isAdmin: false, profile: null, debug }
  debug.foundUser = true

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
    const { isAdmin, profile, debug } = await getAdminInfoForUserToken(req)
    const result: any = { isAdmin: !!isAdmin }
    if (profile) result.profile = profile
    // Only return debug details in non-production to avoid leaking user data
    if (process.env.NODE_ENV !== 'production') {
      result.debug = debug
    }
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error' })
  }
}
