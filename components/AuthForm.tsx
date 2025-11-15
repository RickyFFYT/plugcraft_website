import { useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { extractErrorMessage } from '../lib/utils'
import { supabase, getAuthRedirectUrl } from '../lib/supabase'

interface AuthFormProps {
  type: 'login' | 'signup'
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const isEmailVerified = (user: unknown) => {
    // Support both Supabase fields that may be present depending on versions
    if (!user || typeof user !== 'object') return false
    const u = user as { email_confirmed_at?: string | null; confirmed_at?: string | null }
    return Boolean(u.email_confirmed_at || u.confirmed_at)
  }

  const validatePassword = (p: string) => {
    // Basic password strength rules enforced client-side
    if (!p || p.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(p)) return 'Password must contain at least one uppercase letter.'
    if (!/[0-9]/.test(p)) return 'Password must contain at least one digit.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const trimmedEmail = email.trim()
      const trimmedName = name.trim().slice(0, 120)

      // Validate client-side first
      const pwError = validatePassword(password)
      if (type === 'signup' && pwError) {
        setFeedback({ type: 'error', message: pwError })
        setLoading(false)
        return
      }

      if (type === 'signup') {
        // Proxy signup via our server endpoint to get rate-limits and auditing
        const resp = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password, full_name: trimmedName }),
        })
        const json = await resp.json().catch(() => null)
        if (!resp.ok) {
          setFeedback({ type: 'error', message: json?.error || 'Failed to create account' })
        } else {
          setFeedback({ type: 'success', message: 'Signup successful — check your email to verify your account.' })
        }
      } else {
        // Login flow: authenticate with password but do not allow silent access
        const signinResp = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        })
        type SignInResp = { data?: { session?: Session | null; user?: User | null }; error?: string }
        const signinJson = (await signinResp.json().catch(() => null)) as SignInResp | null
        if (!signinResp.ok) {
          setFeedback({ type: 'error', message: signinJson?.error || 'Failed to sign in' })
        } else {
          const { data } = signinJson || {}
          if (data?.session) {
            try {
              await supabase.auth.setSession(data.session)
            } catch (e) {
              console.warn('Failed to set session:', e)
            }
          }
          if (!data?.user || !isEmailVerified(data.user)) {
            try { await supabase.auth.signOut() } catch {}
            await fetch('/api/auth/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: trimmedEmail, action: 'confirm' }) })
            setFeedback({ type: 'error', message: 'Email not verified. A verification link has been sent to your email address.' })
          } else {
            setFeedback({ type: 'success', message: 'Signed in successfully.' })
          }
        }
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      setFeedback({ type: 'error', message: msg || 'Authentication failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 glass-card force-sheen p-8 shadow-2xl border border-white/10">
      {type === 'signup' && (
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoComplete="name"
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
        autoComplete="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
        minLength={8}
        autoComplete={type === 'signup' ? 'new-password' : 'current-password'}
      />

      {feedback && <p role="status" aria-live="polite" className={`text-sm ${feedback.type === 'error' ? 'text-rose-200' : 'text-emerald-200'}`}>{feedback.message}</p>}

      <button type="submit" disabled={loading} className="w-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-fuchsia-500 text-white p-3 rounded-lg font-bold shadow-lg hover:-translate-y-1 transition disabled:opacity-60" aria-live="polite">
        {loading ? 'Loading...' : type === 'signup' ? 'Sign up' : 'Log in'}
      </button>
    </form>
  )
}
