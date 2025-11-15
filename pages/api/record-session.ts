import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let authHeaderRaw = req.headers.authorization || (req.headers['authorization'] as string | undefined) || (req.headers['Authorization'] as string | undefined)
  if (Array.isArray(authHeaderRaw)) authHeaderRaw = authHeaderRaw[0]
  const authHeader = typeof authHeaderRaw === 'string' ? authHeaderRaw : undefined
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return res.status(401).json({ error: 'Missing bearer token' })
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Invalid token' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Server not configured' })

  const supabaseAdmin = createClient(supabaseUrl, serviceKey)

  // Validate token and fetch user
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })
  const userId = userData.user.id

  // parse body
  const { start, end, duration_seconds } = req.body || {}
  if (!duration_seconds || typeof duration_seconds !== 'number') return res.status(400).json({ error: 'duration_seconds must be provided as number' })

  const p_start = start ? new Date(start).toISOString() : new Date().toISOString()
  const p_end = end ? new Date(end).toISOString() : new Date(new Date().getTime() + duration_seconds * 1000).toISOString()

  try {
    const { data, error } = await supabaseAdmin.rpc('record_session', { p_user_id: userId, p_start: p_start, p_end: p_end, p_duration_seconds: duration_seconds })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true, data })
  } catch (err: unknown) {
    console.error('record-session error', err)
    return res.status(500).json({ error: (err as Error)?.message || 'Unknown error' })
  }
}
