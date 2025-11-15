import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env variables')
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Rate limiting parameters
const EMAIL_ATTEMPT_LIMIT = 5
const IP_ATTEMPT_LIMIT = 25
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function getClientIp(req: NextApiRequest) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded) && forwarded.length) return forwarded[0].trim()
  return req.socket.remoteAddress || 'unknown'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' })

  const ip = getClientIp(req)
  const userAgent = String(req.headers['user-agent'] || '')

  try {
    const since = new Date(Date.now() - WINDOW_MS).toISOString()
    // Check recent failed attempts for this email and IP
    const { data: recentEmailAttempts } = await supabaseAdmin
      .from('auth_attempts')
      .select('id, success, ip, created_at')
      .eq('email', email)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100)

    const failedByEmail = (recentEmailAttempts || []).filter((r: any) => !r.success).length
    const failedByIp = (recentEmailAttempts || []).filter((r: any) => String(r.ip) === String(ip) && !r.success).length

    if (failedByEmail >= EMAIL_ATTEMPT_LIMIT) return res.status(429).json({ error: 'Too many attempts for this account. Please wait and try again.' })
    if (failedByIp >= IP_ATTEMPT_LIMIT) return res.status(429).json({ error: 'Too many attempts from this IP. Please wait and try again.' })

    // Attempt authentication with Supabase (Anon client used to perform auth)
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })

    // Log the attempt
    const success = !!data?.user && !error
    await supabaseAdmin.from('auth_attempts').insert([{ email, ip, user_agent: userAgent, action: 'signin', success, meta: { error: error?.message || null } }])

    if (error) {
      // Don't leak which part is wrong — generic message preferred in UI but keep
      // the Supabase message for debugging and logs
      return res.status(401).json({ error: error.message || 'Invalid credentials' })
    }

    return res.status(200).json({ data })
  } catch (err: any) {
    console.error('Sign-in error (server):', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
