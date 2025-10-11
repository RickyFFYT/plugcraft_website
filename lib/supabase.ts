import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
	throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL. Did you populate .env.local and restart the dev server?')
}

if (!supabaseAnonKey) {
	throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Did you populate .env.local and restart the dev server?')
}

if (!siteUrl) {
	throw new Error('Missing NEXT_PUBLIC_SITE_URL. Did you populate .env.local and restart the dev server?')
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
	return `${siteUrl}${path}`
}

// Helper function to get the current site URL (for client-side use)
export const getSiteUrl = () => {
	if (typeof window !== 'undefined') {
		return window.location.origin
	}
	return siteUrl
}
