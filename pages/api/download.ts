import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing bearer token' })

  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Invalid token' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseAdmin = createClient(supabaseUrl, serviceKey)

  // Validate token and get user
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token or user not found' })

  const userId = userData.user.id

  // Find profile linked to auth user
  const { data: profile } = await supabaseAdmin.from('profiles').select('id, quota_limit, disabled').eq('user_id', userId).single()
  if (!profile) return res.status(403).json({ error: 'Profile not found' })
  if (profile.disabled) return res.status(403).json({ error: 'Account disabled' })

  // Calculate usage
  const { data: usageRows } = await supabaseAdmin.from('usage').select('amount').eq('profile_id', profile.id)
  const totalUsed = (usageRows || []).reduce((s: number, r: any) => s + (r.amount || 0), 0)
  const quota = profile.quota_limit ?? 0
  if (quota > 0 && totalUsed >= quota) return res.status(403).json({ error: 'Quota exceeded' })

  // Pick latest stable release
  const { data: release, error: releaseError } = await supabaseAdmin.from('releases').select('storage_path').eq('channel', 'stable').order('uploaded_at', { ascending: false }).limit(1).single()
  if (releaseError || !release) return res.status(500).json({ error: 'No release available' })

  const bucket = 'releases'
  const path = release.storage_path

  // Insert usage record
  const inc = await supabaseAdmin.from('usage').insert([{ profile_id: profile.id, type: 'download', amount: 1 }])
  if (inc.error) return res.status(500).json({ error: 'Failed to record usage' })

  const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (!data) return res.status(500).json({ error: 'Failed to create signed URL' })

  res.status(200).json({ signedUrl: data.signedUrl })
}
