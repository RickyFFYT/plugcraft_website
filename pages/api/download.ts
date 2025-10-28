import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { setSecurityHeaders, extractBearerToken } from '../../lib/security-headers'
import { getEnvVars } from '../../lib/env-validation'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set security headers
  setSecurityHeaders(res)
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = extractBearerToken(req.headers.authorization)
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid bearer token' })
  }

  const env = getEnvVars()
  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  // Validate token and get user
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const userId = userData.user.id

  // Find profile linked to auth user
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, quota_limit, disabled')
    .eq('user_id', userId)
    .single()
  
  if (profileError || !profile) {
    return res.status(403).json({ error: 'Profile not found' })
  }
  
  if (profile.disabled) {
    return res.status(403).json({ error: 'Account disabled' })
  }

  // Check global site settings for software lock
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('site_settings')
    .select('key,value')
    .in('key', ['software_locked','current_version'])
  
  if (settingsError) {
    return res.status(500).json({ error: 'Failed to check site settings' })
  }
  
  const lockedRow = (settings || []).find((s: any) => s.key === 'software_locked')
  const currentVersionRow = (settings || []).find((s: any) => s.key === 'current_version')
  const isLocked = !!(lockedRow?.value?.value)
  const currentVersion = currentVersionRow?.value?.value || null
  
  if (isLocked) {
    // Soft-block downloads when the software is locked — include current version for client info
    return res.status(503).json({ error: 'Software updates are temporarily locked by admin', currentVersion })
  }

  // Calculate usage
  const { data: usageRows, error: usageError } = await supabaseAdmin
    .from('usage')
    .select('amount')
    .eq('profile_id', profile.id)
  
  if (usageError) {
    return res.status(500).json({ error: 'Failed to check usage' })
  }
  
  const totalUsed = (usageRows || []).reduce((s: number, r: any) => s + (r.amount || 0), 0)
  const quota = profile.quota_limit ?? 0
  
  if (quota > 0 && totalUsed >= quota) {
    return res.status(403).json({ error: 'Quota exceeded' })
  }

  // Pick latest stable release
  const { data: release, error: releaseError } = await supabaseAdmin
    .from('releases')
    .select('storage_path')
    .eq('channel', 'stable')
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .single()
  
  if (releaseError || !release) {
    return res.status(500).json({ error: 'No release available' })
  }

  const bucket = 'releases'
  const path = release.storage_path

  // Insert usage record
  const { error: insertError } = await supabaseAdmin
    .from('usage')
    .insert([{ profile_id: profile.id, type: 'download', amount: 1 }])
  
  if (insertError) {
    return res.status(500).json({ error: 'Failed to record usage' })
  }

  const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60)
  
  if (urlError || !signedUrlData) {
    return res.status(500).json({ error: 'Failed to create signed URL' })
  }

  res.status(200).json({ signedUrl: signedUrlData.signedUrl })
}
