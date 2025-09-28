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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (type === 'signup') {
      await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    } else {
      await supabase.auth.signInWithPassword({ email, password })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 glass-card p-8 shadow-2xl border border-white/10">
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
      <button type="submit" disabled={loading} className="w-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-fuchsia-500 text-white p-3 rounded-lg font-bold shadow-lg hover:scale-105 transition disabled:opacity-60">
        {loading ? 'Loading...' : type === 'signup' ? 'Sign Up' : 'Log In'}
      </button>
    </form>
  )
}
