import { useState } from 'react'
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

  const isEmailVerified = (user: any) => {
    // Support both Supabase fields that may be present depending on versions
    return Boolean(user?.email_confirmed_at || user?.confirmed_at)
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
        // Use redirectTo for verification and avoid embedding the user's email in the URL
          const redirect = getAuthRedirectUrl('/verify?method=confirm')

          const { data, error } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: { emailRedirectTo: redirect, data: { full_name: trimmedName } },
          })

        if (error) {
          setFeedback({ type: 'error', message: error.message })
        } else {
          setFeedback({ type: 'success', message: 'Signup successful — check your email to verify your account.' })
        }
      } else {
        // Login flow: authenticate with password but do not allow silent access
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) {
          setFeedback({ type: 'error', message: error.message })
        } else if (!data?.user || !isEmailVerified(data.user)) {
          // If email not confirmed, sign out and send a verification/magic link.
          await supabase.auth.signOut()
          await supabase.auth.signInWithOtp({ email: trimmedEmail, options: { emailRedirectTo: getAuthRedirectUrl('/verify?method=confirm') } })
          setFeedback({ type: 'error', message: 'Email not verified. A verification link has been sent to your email address.' })
        } else {
          setFeedback({ type: 'success', message: 'Signed in successfully.' })
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Authentication failed' })
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

      {feedback && <p className={`text-sm ${feedback.type === 'error' ? 'text-rose-200' : 'text-emerald-200'}`}>{feedback.message}</p>}

      <button type="submit" disabled={loading} className="w-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-fuchsia-500 text-white p-3 rounded-lg font-bold shadow-lg hover:-translate-y-1 transition disabled:opacity-60" aria-live="polite">
        {loading ? 'Loading...' : type === 'signup' ? 'Sign up' : 'Log in'}
      </button>
    </form>
  )
}
