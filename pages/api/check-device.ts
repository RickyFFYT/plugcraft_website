import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Very small in-memory rate limiter to reduce enumeration abuse.
// Note: For a production deployment in serverless environments this should be
// replaced by a proper external rate limiter (Redis, etc.). This is best-effort.
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 20

function parseCookieDevice(header?: string | string[] | undefined) {
  if (!header) return null
  // naive cookie parse for the trusted_device cookie
  const cookies = Array.isArray(header) ? header.join(';') : header
  const matches = cookies.match(/trusted_device=([^;]+)/)
  if (!matches) return null
  try {
    const decoded = Buffer.from(matches[1], 'base64').toString('utf8')
    const [deviceId, token] = decoded.split(':')
    if (!deviceId || !token) return null
    return { deviceId, token }
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  try {
    const now = Date.now()
    const state = RATE_LIMIT_MAP.get(String(ip))
    if (!state || state.resetAt < now) {
      RATE_LIMIT_MAP.set(String(ip), { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    } else {
      state.count += 1
      RATE_LIMIT_MAP.set(String(ip), state)
      if (state.count > RATE_LIMIT_MAX) {
        res.setHeader('Retry-After', Math.ceil((state.resetAt - now) / 1000))
        return res.status(429).json({ error: 'Too many requests' })
      }
    }
  } catch (err) {
    // proceed without rate-limiter if something unexpected occurs
    console.error('Rate limiter error', err)
  }

  const { email } = req.query as { email?: string }
  if (!email) return res.status(400).json({ error: 'Missing email' })

  const cookieHeader = req.headers.cookie
  const parsed = parseCookieDevice(cookieHeader)
  if (!parsed) return res.status(200).json({ trusted: false })

  const tokenHash = crypto.createHash('sha256').update(parsed.token).digest('hex')

  try {
    const { data: rows, error } = await supabase
      .from('trusted_devices')
      .select('device_id, email, status, trusted_until')
      .eq('device_id', parsed.deviceId)
      .limit(1)

    if (error || !rows || rows.length === 0) return res.status(200).json({ trusted: false })

    const device = rows[0]
    if (device.status !== 'trusted') return res.status(200).json({ trusted: false })
    if (device.email !== email) return res.status(200).json({ trusted: false })
    if (device.trusted_until && new Date(device.trusted_until) < new Date()) return res.status(200).json({ trusted: false })

    // Now verify token hash matches
    const { data: verifyRows } = await supabase
      .from('trusted_devices')
      .select('token_hash')
      .eq('device_id', parsed.deviceId)
      .limit(1)

    const storedHash = verifyRows?.[0]?.token_hash
    if (!storedHash) return res.status(200).json({ trusted: false })

    if (storedHash !== tokenHash) return res.status(200).json({ trusted: false })

    return res.status(200).json({ trusted: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
