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

  // Validate request size to prevent DOS
  if (!validateRequestSize(req.body, 10)) {
    return res.status(413).json({ error: 'Request too large' })
  }

  const token = extractBearerToken(req.headers.authorization)
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid bearer token' })
  }

  const env = getEnvVars()
  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  // Validate token and fetch user
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  const userId = userData.user.id

  // parse body
  const { start, end, duration_seconds } = req.body || {}
  
  if (!duration_seconds || typeof duration_seconds !== 'number') {
    return res.status(400).json({ error: 'duration_seconds must be provided as number' })
  }
  
  // Validate duration_seconds is reasonable (not negative, not too large)
  if (duration_seconds < 0 || duration_seconds > 86400) {
    return res.status(400).json({ error: 'duration_seconds must be between 0 and 86400 (24 hours)' })
  }

  const p_start = start ? new Date(start).toISOString() : new Date().toISOString()
  const p_end = end ? new Date(end).toISOString() : new Date(new Date().getTime() + duration_seconds * 1000).toISOString()

  try {
    const { data, error } = await supabaseAdmin.rpc('record_session', { 
      p_user_id: userId, 
      p_start: p_start, 
      p_end: p_end, 
      p_duration_seconds: duration_seconds 
    })
    
    if (error) {
      console.error('record_session RPC error:', error)
      return res.status(500).json({ error: 'Failed to record session' })
    }
    
    return res.status(200).json({ ok: true, data })
  } catch (err: any) {
    console.error('record-session error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
