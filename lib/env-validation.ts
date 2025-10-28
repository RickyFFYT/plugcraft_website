/**
 * Centralized environment variable validation
 * This ensures all required env vars are present and valid before the app starts
 */

export interface EnvVars {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  NEXT_PUBLIC_SITE_URL: string
}

/**
 * Validate required environment variables
 * @throws Error if any required env var is missing or invalid
 */
export function validateEnvVars(): EnvVars {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  const errors: string[] = []

  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else if (!supabaseUrl.startsWith('http')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL')
  }

  if (!anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  } else if (anonKey.length < 20) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)')
  }

  if (!serviceKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required')
  } else if (serviceKey.length < 20) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)')
  }

  if (!siteUrl) {
    errors.push('NEXT_PUBLIC_SITE_URL is required')
  } else if (!siteUrl.startsWith('http')) {
    errors.push('NEXT_PUBLIC_SITE_URL must be a valid HTTP(S) URL')
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      'Please check your .env.local file and restart the server.'
    )
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey!,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey!,
    NEXT_PUBLIC_SITE_URL: siteUrl!,
  }
}

/**
 * Get validated environment variables
 * Safe to call multiple times - validates on first call and caches result
 */
let cachedEnv: EnvVars | null = null

export function getEnvVars(): EnvVars {
  if (!cachedEnv) {
    cachedEnv = validateEnvVars()
  }
  return cachedEnv
}
