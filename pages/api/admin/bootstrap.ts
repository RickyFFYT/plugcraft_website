import type { NextApiRequest, NextApiResponse } from 'next'
import { extractErrorMessage } from '../../../lib/utils'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env vars for admin bootstrap')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * Bootstrap endpoint: grant admin access to the currently logged-in user.
 * USE ONLY IN DEVELOPMENT to set up your first admin.
 * After that, use the admin panel to manage admin_emails.
 * 
 * Usage:
 * - Log in with your user account
 * - Call POST /api/admin/bootstrap with Authorization: Bearer <your-access-token>
 * - This will insert your email into admin_emails and/or set is_admin=true on your profile
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Safety: only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Bootstrap endpoint disabled in production' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const auth = req.headers.authorization || req.headers.Authorization
    if (!auth || typeof auth !== 'string') {
      return res.status(401).json({ error: 'Missing Authorization header' })
    }
    const token = auth.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Invalid Authorization header format' })
    }

    // Get user from token
    type SupabaseUser = { id?: string; email?: string | null; user_metadata?: { full_name?: string } }
    let user: SupabaseUser | null = null
    try {
      const { data } = await supabaseAdmin.auth.getUser(token)
      if (data?.user) user = data.user
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    if (!user || !user.email) {
      return res.status(401).json({ error: 'Could not resolve user from token' })
    }

    const email = user.email
    const userId = user.id

    // 1. Ensure admin_emails contains this email (case-insensitive check first)
    const { data: existingEmail } = await supabaseAdmin
      .from('admin_emails')
      .select('email')
      .ilike('email', email)
      .maybeSingle()

    if (!existingEmail) {
      const { error: insertErr } = await supabaseAdmin
        .from('admin_emails')
        .insert([{ email }])
      if (insertErr) {
        console.error('Failed to insert into admin_emails:', insertErr)
        return res.status(500).json({ error: 'Failed to insert email into admin_emails', details: insertErr.message })
      }
    }

    // 2. Ensure profiles table has a row with is_admin=true for this user
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id,is_admin')
      .eq('user_id', userId)
      .maybeSingle()

    if (!profile) {
      // Create profile
      const { error: createErr } = await supabaseAdmin
        .from('profiles')
        .insert([{ user_id: userId, is_admin: true, full_name: user.user_metadata?.full_name || null }])
      if (createErr) {
        console.error('Failed to create profile:', createErr)
        return res.status(500).json({ error: 'Failed to create profile', details: createErr.message })
      }
    } else if (!profile.is_admin) {
      // Update profile to set is_admin=true
      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ is_admin: true })
        .eq('user_id', userId)
      if (updateErr) {
        console.error('Failed to update profile:', updateErr)
        return res.status(500).json({ error: 'Failed to update profile', details: updateErr.message })
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Admin access granted',
      email,
      userId,
    })
  } catch (err: unknown) {
    console.error('Bootstrap error:', err)
    const msg = extractErrorMessage(err)
    return res.status(500).json({ error: msg || 'Server error' })
  }
}
