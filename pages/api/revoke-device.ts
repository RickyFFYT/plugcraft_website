import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { setSecurityHeaders, extractBearerToken, validateRequestSize } from '../../lib/security-headers'
import { getEnvVars } from '../../lib/env-validation'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set security headers
  setSecurityHeaders(res)
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate request size
  if (!validateRequestSize(req.body, 10)) {
    return res.status(413).json({ error: 'Request too large' })
  }

  const { device_id } = req.body
  if (!device_id || typeof device_id !== 'string') {
    return res.status(400).json({ error: 'Valid device_id is required' })
  }

  const accessToken = extractBearerToken(req.headers.authorization)
  if (!accessToken) {
    return res.status(401).json({ error: 'Missing or invalid bearer token' })
  }

  const env = getEnvVars()
  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken)
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid session' })
    }
    const user = userData.user

    const { error } = await supabaseAdmin
      .from('trusted_devices')
      .update({ status: 'revoked' })
      .eq('device_id', device_id)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Failed to revoke device:', error)
      return res.status(500).json({ error: 'Failed to revoke device' })
    }

    // Clear cookie with improved security settings (use Strict for consistency)
    const isProd = process.env.NODE_ENV === 'production'
    res.setHeader(
      'Set-Cookie', 
      `trusted_device=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; ${isProd ? 'Secure; ' : ''}`
    )

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('revoke-device error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
