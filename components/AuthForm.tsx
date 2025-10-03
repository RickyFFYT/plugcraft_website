import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuthFormProps {
  type: 'login' | 'signup'
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      if (type === 'signup') {
        // Send sign-up request and instruct user to verify their email via /verify
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/verify?method=confirm&email=${encodeURIComponent(email)}` },
        })
        if (error) {
          setFeedback({ type: 'error', message: error.message })
        } else {
          setFeedback({ type: 'success', message: 'Signup successful — check your email to verify your account.' })
        }
      } else {
        // Login flow: authenticate with password but do not allow silent access
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setFeedback({ type: 'error', message: error.message })
        } else if (!data?.user?.email_confirmed_at) {
          // If email not confirmed, sign out and send a verification/magic link.
          await supabase.auth.signOut()
          await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/verify?method=confirm&email=${encodeURIComponent(email)}` },
          })
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
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
      />

      {feedback && <p className={`text-sm ${feedback.type === 'error' ? 'text-rose-200' : 'text-emerald-200'}`}>{feedback.message}</p>}

      <button type="submit" disabled={loading} className="w-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-fuchsia-500 text-white p-3 rounded-lg font-bold shadow-lg hover:scale-105 transition disabled:opacity-60">
        {loading ? 'Loading...' : type === 'signup' ? 'Sign Up' : 'Log In'}
      </button>
    </form>
  )
}
