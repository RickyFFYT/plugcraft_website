import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
	throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL. Did you populate .env.local and restart the dev server?')
}

if (!supabaseAnonKey) {
	throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Did you populate .env.local and restart the dev server?')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
