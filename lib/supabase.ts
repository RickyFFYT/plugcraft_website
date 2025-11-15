import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use NEXT_PUBLIC_SITE_URL if available, otherwise use VERCEL_URL or fallback to localhost
let siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
	|| (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

// Production safety guard: don't let a production server run with a site URL that
// points to localhost or is not configured. Allow preview builds which set
// VERCEL_URL in preview environments (so you can leave NEXT_PUBLIC_SITE_URL
// unset for previews and still have the app work).
const isProd = process.env.NODE_ENV === 'production'
const hasExplicitSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL
const hasVercelUrl = !!process.env.VERCEL_URL
const forbiddenLocalhostRegex = /(localhost|127(?:\.[0-9]{1,3}){3}|\[::1\])/i
if (isProd) {
	// If we don't have either NEXT_PUBLIC_SITE_URL or VERCEL_URL, we cannot
	// reliably construct redirects for production. Throw to avoid accidentally
	// sending emails that point to localhost or misconfigured domains.
	if (!hasExplicitSiteUrl && !hasVercelUrl) {
		throw new Error(`Missing NEXT_PUBLIC_SITE_URL or VERCEL_URL in production: ${siteUrl}. Please set NEXT_PUBLIC_SITE_URL to your production domain.`)
	}
	// Disallow localhost-style site addresses in production (extra safety)
	if (forbiddenLocalhostRegex.test(siteUrl)) {
		throw new Error(`Invalid NEXT_PUBLIC_SITE_URL for production: ${siteUrl}. Please set NEXT_PUBLIC_SITE_URL to your production domain.`)
	}
}

// Normalize the site URL to avoid double-slash issues (strip trailing slash)
siteUrl = siteUrl.replace(/\/+$/, '')

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
	throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL. Did you populate .env.local and restart the dev server?')
}

if (!supabaseAnonKey) {
	throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Did you populate .env.local and restart the dev server?')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		flowType: 'pkce'
	}
})

// Helper function to get the correct redirect URL for auth flows
export const getAuthRedirectUrl = (path: string = '/verify') => {
	// Ensure the path starts with a single leading slash
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	return `${siteUrl}${normalizedPath}`
}

// Helper function to get the current site URL (for client-side use)
export const getSiteUrl = () => {
	if (typeof window !== 'undefined') {
		return window.location.origin
	}
	return siteUrl
}
