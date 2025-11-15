export interface Announcement {
  id?: string
  title: string
  body: string
  starts_at?: string | null
  ends_at?: string | null
}

export interface NewAnnouncement {
  title: string
  body: string
  starts_at?: string | null
  ends_at?: string | null
}

export interface SiteSetting {
  id?: number
  key: string
  value?: unknown
}

export interface Release {
  name?: string
  version?: string
  notes?: string
  download_url?: string
}

export interface UsageWindow {
  total_used_seconds?: number | null
  max_usage_seconds?: number | null
  window_seconds?: number | null
  window_start?: string | null
}

export interface RecentUsageRow {
  type: string
  amount: number
  created_at: string
  meta?: Record<string, unknown> | null
}

export interface UserRow {
  id: string
  email: string
  full_name?: string
  last_sign_in_at?: string
  is_admin?: boolean
  profile_id?: string
  disabled?: boolean
  banned_until?: string | null
  ban_reason?: string | null
  quota_limit?: number | null
  usage_window?: UsageWindow | null
  recent_usage?: RecentUsageRow[] | null
}

export interface ProfileRow {
  user_id?: string
  full_name?: string | null
  is_admin?: boolean
  disabled?: boolean
  last_login?: string | null
  id?: number | string
  quota_limit?: number | null
  banned_until?: string | null
  ban_reason?: string | null
}

export interface UsageWindowRow {
  user_id?: number | string
  total_used_seconds?: number | null
  max_usage_seconds?: number | null
  window_seconds?: number | null
  window_start?: string | null
}

export interface UsageRow {
  profile_id?: number | string
  type?: string
  amount?: number
  meta?: Record<string, unknown> | null
  created_at?: string
}
