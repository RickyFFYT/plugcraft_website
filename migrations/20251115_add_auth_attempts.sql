-- Migration: Add auth_attempts table to track authentication attempts for rate limiting and security logs

CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  action TEXT NOT NULL DEFAULT 'signin', -- 'signin', 'signup', 'otp', 'reset'
  success BOOLEAN NOT NULL DEFAULT FALSE,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_created_at ON public.auth_attempts (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_created_at ON public.auth_attempts (ip, created_at DESC);
