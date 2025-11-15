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

// Rate limiting parameters for OTP flows — more permissive than password
const EMAIL_OTP_LIMIT = 5
const IP_OTP_LIMIT = 25
const WINDOW_MS = 60 * 60 * 1000 // 60 minutes

function getClientIp(req: NextApiRequest) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded) && forwarded.length) return forwarded[0].trim()
  return req.socket.remoteAddress || 'unknown'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, action = 'magic', redirect: providedRedirect } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Missing email' })

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

    const failedByEmail = (recent || []).filter((r: { success?: boolean }) => !r.success).length
    const failedByIp = (recent || []).filter((r: { ip?: string; success?: boolean }) => String(r.ip) === String(ip) && !r.success).length

    if (failedByEmail >= EMAIL_OTP_LIMIT) return res.status(429).json({ error: 'Too many requests for this account. Please wait and try again.' })
    if (failedByIp >= IP_OTP_LIMIT) return res.status(429).json({ error: 'Too many requests from this IP. Please wait and try again.' })

    // Depending on action, choose the redirect to show correct message
    let emailRedirectTo: string
    if (providedRedirect) {
      // Validate allowed origins for redirects (avoid open redirect abuse)
      const EMAIL_SITE = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      try {
        const urlParsed = new URL(providedRedirect)
        if (urlParsed.origin !== EMAIL_SITE) {
          return res.status(400).json({ error: 'Invalid redirect specified' })
        }
      } catch {
        return res.status(400).json({ error: 'Invalid redirect format' })
      }
      emailRedirectTo = providedRedirect
    } else if (action === 'confirm') {
      emailRedirectTo = getAuthRedirectUrl('/verify?method=confirm')
    } else if (action === 'reset') {
      emailRedirectTo = getAuthRedirectUrl('/verify?method=reset')
    } else {
      emailRedirectTo = getAuthRedirectUrl('/verify?method=magic')
    }

    const { data, error } = await supabaseAnon.auth.signInWithOtp({ email, options: { emailRedirectTo } })

    await supabaseAdmin.from('auth_attempts').insert([{ email, ip, user_agent: String(req.headers['user-agent'] || ''), action, success: !error, meta: { error: error?.message || null } }])

    if (error) return res.status(500).json({ error: error.message || 'Failed to send link' })
    return res.status(200).json({ data })
  } catch (err: unknown) {
    console.error('OTP send error (server):', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
