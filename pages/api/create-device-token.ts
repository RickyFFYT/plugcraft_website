import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { setSecurityHeaders, sanitizeEmail, validateRequestSize } from '../../lib/security-headers'
import { getEnvVars } from '../../lib/env-validation'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set security headers
  setSecurityHeaders(res)
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate request size
  if (!validateRequestSize(req.body, 5)) {
    return res.status(413).json({ error: 'Request too large' })
  }

  const { email } = req.body
  const sanitizedEmail = sanitizeEmail(email)
  
  if (!sanitizedEmail) {
    return res.status(400).json({ error: 'Valid email is required' })
  }

  const env = getEnvVars()
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    const deviceId = crypto.randomUUID()
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h

    const { error } = await supabase.from('trusted_devices').insert([
      { 
        device_id: deviceId, 
        email: sanitizedEmail, 
        token_hash: tokenHash, 
        status: 'pending', 
        expires_at: expiresAt 
      },
    ])

    if (error) {
      console.error('Failed to create device token:', error)
      return res.status(500).json({ error: 'Failed to create device token' })
    }

    // Return deviceId and token so the client can include it in the redirect
    return res.status(200).json({ device_id: deviceId, token })
  } catch (err) {
    console.error('create-device-token error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
