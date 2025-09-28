import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export default function SignupPage() {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-success`,
        data: {
          full_name: name,
        },
      },
    })

    if (error) {
      setLoading(false)
      setFeedback({ type: 'error', message: error.message })
      return
    }

    if (data.user) {
      await supabaseClient.from('profiles').upsert({
        user_id: data.user.id,
        full_name: name,
      })
    }

    setLoading(false)
    setFeedback({
      type: 'success',
      message: 'Account created! Check your inbox to verify your email before logging in.',
    })
    setPassword('')
  }

  return (
    <>
      <Head>
        <title>Sign up | Plugcraft</title>
      </Head>
      <div className="flex min-h-[calc(100vh-136px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-500/20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Create your Plugcraft account</h1>
            <p className="mt-2 text-sm text-slate-300">
              Verify once, download forever. Set your credentials and unlock Ghosted.
            </p>
          </div>
          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-slate-200">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ghosted Pro"
                className="mt-2 w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                required
              />
            </div>
            {feedback && (
              <p className={`text-sm ${feedback.type === 'error' ? 'text-rose-200' : 'text-emerald-200'}`}>
                {feedback.message}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-300">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-200 hover:text-indigo-100">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
