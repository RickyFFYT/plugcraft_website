import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAuthRedirectUrl } from '../../../lib/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env variables')
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Rate limiting for signups
const SIGNUP_LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000 // 60 minutes

function getClientIp(req: NextApiRequest) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded) && forwarded.length) return forwarded[0].trim()
  return req.socket.remoteAddress || 'unknown'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, full_name } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' })

  const ip = getClientIp(req)
  try {
    const since = new Date(Date.now() - WINDOW_MS).toISOString()
    const { data: recent } = await supabaseAdmin
      .from('auth_attempts')
      .select('id, success, ip, created_at')
      .eq('email', email)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100)

    const attempts = (recent || []).length
    if (attempts >= SIGNUP_LIMIT) return res.status(429).json({ error: 'Too many signup attempts. Try again later.' })

    const redirect = getAuthRedirectUrl('/verify?method=confirm')
    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect, data: { full_name } },
    })

    await supabaseAdmin.from('auth_attempts').insert([{ email, ip, user_agent: String(req.headers['user-agent'] || ''), action: 'signup', success: !error, meta: { error: error?.message || null } }])

    if (error) return res.status(400).json({ error: error.message })

    // If user created, ensure profile row exists
    if (data?.user) {
      try {
        await supabaseAdmin.from('profiles').upsert({ user_id: data.user.id, full_name: full_name || null })
      } catch (err) {
        console.error('Failed to upsert profile:', err)
      }
    }

    return res.status(200).json({ data })
  } catch (err: any) {
    console.error('Signup error (server):', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
