import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthRedirectUrl, getSiteUrl } from '../../lib/supabase'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const siteUrl = getSiteUrl()
  const authRedirect = getAuthRedirectUrl('/verify')
  return res.status(200).json({ siteUrl, authRedirect, isProd: process.env.NODE_ENV === 'production' })
}
