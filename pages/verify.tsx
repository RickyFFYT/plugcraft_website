import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { getAuthRedirectUrl } from '../lib/supabase'

export default function VerifyPage() {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const { method } = router.query as { method?: string }

  const [message, setMessage] = useState('Processing...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If the user is already authenticated, show a success message.
    if (user) {
      setMessage('Your email has been verified and you are signed in. Redirecting to dashboard...')
      const t = setTimeout(() => router.replace('/dashboard'), 1800)
      return () => clearTimeout(t)
    }

    // If we don't have a user, display contextual instructions depending on the
    // method used to arrive here (confirm from signup, magic link, reset, etc.).
    if (method === 'confirm') {
      setMessage('A verification link was sent to your email. Please check your inbox and follow the instructions to verify your account.')
      return
    }

    if (method === 'magic') {
      setMessage('A magic sign-in link was sent to your email. If you clicked the link, you should be signed in automatically. If not, check the link or request a new one.')
      return
    }

    if (method === 'reset') {
      setMessage('If an account exists for the provided email, a password reset link was sent. Check your inbox.')
      return
    }

    // Generic fallback
    setMessage('If you just completed an action from your email, and you are not signed in, please try the link again or request a new one from the login page.')
  }, [user, method, router])

  // If the query indicates device verification, and the user is signed in,
  // confirm the device server-side so the cookie is set.
  useEffect(() => {
    const tryConfirmDevice = async () => {
      if (method === 'device' && typeof router.query.device_id === 'string' && typeof router.query.token === 'string') {
        // Wait for supabase auth to complete and user to be available.
        if (!user) return
        try {
          const session = await supabaseClient.auth.getSession()
          const accessToken = session?.data?.session?.access_token
          if (!accessToken) {
            setError('Unable to confirm device: missing session')
            return
          }

          const resp = await fetch('/api/confirm-device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ device_id: router.query.device_id, token: router.query.token }),
          })
          const json = await resp.json()
          if (!resp.ok) {
            setError(json?.error || 'Failed to confirm device')
          } else {
            setMessage('Device confirmed and trusted for 30 days. Redirecting to dashboard...')
            const t = setTimeout(() => router.replace('/dashboard'), 1500)
            return () => clearTimeout(t)
          }
        } catch (err) {
          setError('Failed to confirm device')
        }
      }
    }

    tryConfirmDevice()
  }, [user, method, router])

  // Provide an action to re-send a magic link if a user lands here without
  // being signed in and wants another email. This is intentionally rate
  // limited on the server side by Supabase; we still disable the button while
  // sending to avoid accidental duplicates.
  const [resending, setResending] = useState(false)
  const resendMagicLink = async () => {
    setResending(true)
    setError(null)
    const redirectUrl = getAuthRedirectUrl('/verify?method=magic')
    const resp = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: router.query.email as string || '', action: 'magic', redirect: redirectUrl }),
    })
    const json = await resp.json().catch(() => null)
    setResending(false)
    if (!resp.ok) setError(json?.error || 'Failed to resend magic link')
    else setMessage('Magic link resent. Check your inbox.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Verification</h2>
        <p className="text-sm text-slate-300 mb-6">{message}</p>

        {error && <p className="text-sm text-rose-200 mb-4">{error}</p>}

        {!user && (method === 'confirm' || method === 'magic') && (
          <div className="flex flex-col gap-3 items-center">
            <button onClick={resendMagicLink} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60" disabled={resending}>
              {resending ? 'Resending...' : 'Resend link'}
            </button>
            <Link href="/login" className="text-sm text-indigo-200 hover:text-indigo-100">Go back to login</Link>
          </div>
        )}

        {!user && method === 'reset' && (
          <div>
            <Link href="/login" className="px-4 py-2 rounded bg-indigo-600 text-white">Return to login</Link>
          </div>
        )}

        {user && (
          <div className="mt-4">
            <Link href="/dashboard" className="px-4 py-2 rounded bg-emerald-600 text-white">Continue to dashboard</Link>
          </div>
        )}
      </div>
    </div>
  )
}
