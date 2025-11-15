import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) console.error('Missing SUPABASE_SERVICE_ROLE_KEY')

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { device_id } = req.body
  if (!device_id) return res.status(400).json({ error: 'Missing device_id' })

  // Expect Authorization: Bearer <access_token>
  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/^Bearer (.+)$/)
  if (!match) return res.status(401).json({ error: 'Missing bearer token' })
  const accessToken = match[1]

  try {
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken)
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' })
    const user = userData.user

    const { error } = await supabaseAdmin.from('trusted_devices').update({ status: 'revoked' }).eq('device_id', device_id).eq('user_id', user.id)
    if (error) return res.status(500).json({ error: 'Failed to revoke device' })

    // Also clear cookie
    res.setHeader('Set-Cookie', `trusted_device=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}`)

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
