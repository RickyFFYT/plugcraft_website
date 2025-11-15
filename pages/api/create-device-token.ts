import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side use of anon client to insert a pending device row via SQL API
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email' })

  try {
    const deviceId = crypto.randomUUID()
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h

    const { error } = await supabase.from('trusted_devices').insert([
      { device_id: deviceId, email, token_hash: tokenHash, status: 'pending', expires_at: expiresAt },
    ])

    if (error) {
      console.error('Failed to create device token:', error)
      return res.status(500).json({ error: 'Failed to create device token' })
    }

    // Return deviceId and token so the client can include it in the redirect
    return res.status(200).json({ device_id: deviceId, token })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
