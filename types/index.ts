// Common types used across the application

export interface Profile {
  id: string
  user_id: string
  full_name?: string | null
  is_admin?: boolean
  quota?: number
  disabled?: boolean
  banned_until?: string | null
  ban_reason?: string | null
  max_usage_seconds?: number
  window_seconds?: number
}

export interface Setting {
  key: string
  value: Record<string, unknown>
}

export interface Release {
  version: string
  url?: string
  changelog?: string
}

export interface UsageWindow {
  user_id: string
  window_start: string
  window_end: string
  total_seconds: number
  max_usage_seconds: number
  window_seconds: number
}

export interface SessionData {
  access_token: string
  refresh_token?: string
}

export interface AuthAttempts {
  anon: { ok: boolean; error?: string | null }
  admin: { ok: boolean; error?: string | null }
}
