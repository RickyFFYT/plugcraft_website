import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || '')

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { device_id, token } = req.body
  if (!device_id || !token) return res.status(400).json({ error: 'Missing device_id or token' })

  // Expect an Authorization: Bearer <access_token> header so we can identify the user
  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/^Bearer (.+)$/)
  if (!match) return res.status(401).json({ error: 'Missing bearer token' })
  const accessToken = match[1]

  try {
    // Verify user via the service role client
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken)
    if (userErr || !userData?.user) {
      console.error('Unable to get user from access token', userErr)
      return res.status(401).json({ error: 'Invalid session' })
    }

    const user = userData.user
    const tokenHash = hashToken(token)

    const { data: deviceRows, error: fetchErr } = await supabaseAdmin
      .from('trusted_devices')
      .select('*')
      .eq('device_id', device_id)
      .limit(1)

    if (fetchErr || !deviceRows || deviceRows.length === 0) {
      console.error('Device record not found', fetchErr)
      return res.status(404).json({ error: 'Device not found' })
    }

    const device = deviceRows[0]
    if (device.status !== 'pending') return res.status(400).json({ error: 'Device not pending' })
    if (device.token_hash !== tokenHash) return res.status(400).json({ error: 'Invalid token' })
    if (device.expires_at && new Date(device.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' })

    const trustedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

    const { error: updateErr } = await supabaseAdmin
      .from('trusted_devices')
      .update({ status: 'trusted', user_id: user.id, trusted_until: trustedUntil, last_seen: new Date().toISOString() })
      .eq('device_id', device_id)

    if (updateErr) {
      console.error('Failed to mark device trusted', updateErr)
      return res.status(500).json({ error: 'Failed to mark device trusted' })
    }

    // Set an httpOnly cookie so future visits from this device present the
    // token to server endpoints. Store the raw token in the cookie because
    // the server stores only a hash.
    const cookieValue = Buffer.from(`${device_id}:${token}`).toString('base64')
    const maxAge = 30 * 24 * 60 * 60 // 30 days
    const isProd = process.env.NODE_ENV === 'production'

    res.setHeader('Set-Cookie', `trusted_device=${cookieValue}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${isProd ? 'Secure; ' : ''}`)

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
