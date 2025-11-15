import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import SEO from '../components/SEO'
import AuthCard from '../components/AuthCard'
import { getAuthRedirectUrl } from '../lib/supabase'

// Use public assets for logos
const GhostedLogo = '/assets/Ghosted_logo.png'

export default function LoginPage() {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const MAX_PW_ATTEMPTS = 5

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      // First, check if this device is already trusted for the provided email.
      // This endpoint reads the httpOnly cookie that marks a device and returns
      // whether it is trusted for this email. If it's trusted we can allow a
      // password sign-in without forcing a magic link.
      const checkResp = await fetch(`/api/check-device?email=${encodeURIComponent(email)}`)
      const checkJson = await checkResp.json()
      const deviceTrusted = checkJson?.trusted === true

      if (!trustDevice && !deviceTrusted) {
        // Not trusting device and device not previously verified: require magic link flow
        const redirectUrl = getAuthRedirectUrl('/verify?method=magic')
        const otpResp = await fetch('/api/auth/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'magic', redirect: redirectUrl }),
        })
        const otpJson = await otpResp.json().catch(() => null)
        if (!otpResp.ok) {
          setFeedback({ type: 'error', message: otpJson?.error || 'Failed to send magic link' })
        } else {
          setFeedback({ type: 'success', message: 'Magic link sent — check your email to finish signing in.' })
        }
        setLoading(false)
        return
      }

      // If device is trusted OR user checked "trust this device", proceed
      // with password sign-in. If user requested to trust the device we will
      // still require a follow-up verification email to finalize the trusted
      // device registration (the server will only mark devices trusted after
      // the user clicks the verification link).
      // Enforce a small client-side retry limit for password attempts. This
      // is not a security boundary but helps mitigate brute force attempts
      // on the client and degrades gracefully by offering the magic link.
      const lowerEmail = email.trim().toLowerCase()
      const attemptsKey = `pwAttempts:${lowerEmail}`
      const lockKey = `pwLock:${lowerEmail}`
      const attemptsStr = typeof window !== 'undefined' ? sessionStorage.getItem(attemptsKey) : null
      const lockUntilStr = typeof window !== 'undefined' ? sessionStorage.getItem(lockKey) : null
      const lockUntil = lockUntilStr ? Number(lockUntilStr) : 0
      if (lockUntil && Date.now() < lockUntil) {
        setFeedback({ type: 'error', message: 'Too many failed password attempts. Please try again later or use a magic link.' })
        setLoading(false)
        return
      }

      const signinResp = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      interface SignInResponse {
        data?: { user?: { id?: string; email_confirmed_at?: string }; session?: Record<string, unknown> }
        error?: { message?: string }
      }
      let signinJson: SignInResponse | null = null
      try {
        signinJson = await signinResp.json()
      } catch (_) {
        signinJson = null
      }

      if (!signinResp.ok) {
        setFeedback({ type: 'error', message: signinJson?.error || 'Sign in failed' })
        setLoading(false)
        return
      }

      const { data } = signinJson || {}
      // If the server returned a session, set it in the client-side supabase client
      if (data?.session) {
        try {
          await supabaseClient.auth.setSession(data.session)
        } catch (e) {
          console.warn('Failed to set session client-side', e)
        }
      }

      if (signinJson?.error) {
        // Increment local attempt counter
        try {
          const prev = attemptsStr ? Number(attemptsStr) || 0 : 0
          const next = prev + 1
          sessionStorage.setItem(attemptsKey, String(next))
          if (next >= MAX_PW_ATTEMPTS) {
            // Lock for a short duration and ask user to use magic link.
            const lockMs = 30 * 1000 // 30s
            sessionStorage.setItem(lockKey, String(Date.now() + lockMs))
            setFeedback({ type: 'error', message: 'Too many failed attempts. Use a magic link or try again in 30 seconds.' })
            setLoading(false)
            return
          }
        } catch (e) {
          // Ignore storage errors
        }
        setFeedback({ type: 'error', message: signinJson?.error || 'Sign in failed' })
        setLoading(false)
        return
      }

      const signedInUser = data?.user

      if (!signedInUser || !signedInUser.email_confirmed_at) {
        try { await supabaseClient.auth.signOut() } catch {}
        const resendResp = await fetch('/api/auth/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'confirm' }),
        })
        const resendJson = await resendResp.json().catch(() => null)

        if (!resendResp.ok) {
          setFeedback({ type: 'error', message: resendJson?.error || 'Signed in but email not verified — failed to send verification email. Please contact support.' })
        } else {
          setFeedback({ type: 'success', message: 'Email not verified. A verification link was sent to your inbox.' })
        }

        setLoading(false)
        return
      }

      // If the user requested to trust this device AND the password sign-in
      // succeeded, trigger the device-trust verification email flow which will
      // send an email containing the device token that the user must click to
      // finish trusting the device for 30 days.
      if (trustDevice && !deviceTrusted) {
        // Create a pending device token server-side
        const tokenResp = await fetch('/api/create-device-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const tokenJson = await tokenResp.json()
        if (!tokenResp.ok) {
          setFeedback({ type: 'error', message: tokenJson?.error || 'Failed to initiate device verification.' })
          setLoading(false)
          return
        }

        // Use Supabase to email the device verification link to the user. The
        // redirect contains the token so that when the user clicks it the
        // server can confirm and mark the device trusted.
  const redirectUrl = getAuthRedirectUrl(`/verify?method=device&device_id=${encodeURIComponent(tokenJson.device_id)}&token=${encodeURIComponent(tokenJson.token)}`)
  const otpResp = await fetch('/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, action: 'device', redirect: redirectUrl }),
  })
  const otpJson = await otpResp.json().catch(() => null)
        if (!otpResp.ok) {
          setFeedback({ type: 'error', message: otpJson?.error || 'Failed to send device confirmation email' })
        } else {
          setFeedback({ type: 'success', message: 'Signed in. A confirmation email was sent to finish trusting this device.' })
        }

        // We don't immediately mark the device trusted — it will become trusted
        // after the user clicks the link and the server marks the device and
        // sets the cookie. For now we keep the user signed in and inform them.
        router.replace('/dashboard')
        setLoading(false)
        return
      }

      // Standard verified password flow — user is signed in and verified
      router.replace('/dashboard')
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err?.message || 'Sign in failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO title="Log in — Plugcraft" description="Log in to your Plugcraft (Ghosted) account to access downloads, dashboard, and support." />
      <AuthCard title="Welcome back" subtitle="Sign in to manage your Ghosted downloads and usage." leftGraphic={<Image src={GhostedLogo} alt="Ghosted" width={160} height={160} className="rounded-md" />}> 
        <form onSubmit={handleLogin} className="mt-2 space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/10 bg-black/40 p-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                required
                autoComplete="email"
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
                // Only required when the user intends to sign in with password
                required={trustDevice}
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input id="trust-device" type="checkbox" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40" />
              <div>
                <label htmlFor="trust-device" className="text-slate-300">Trust this device for 30 days (required to sign-in with password)</label>
                <p className="text-xs text-slate-400 mt-1">Only enable this for personal devices. You will receive a confirmation email when you request device trust.</p>
              </div>
            </div>
            {feedback && (
              <p role="status" aria-live="polite" className={`text-sm ${feedback.type === 'error' ? 'text-rose-200' : 'text-emerald-200'} transition-all duration-300`}>{feedback.message}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <MagicLinkButton email={email} setFeedback={setFeedback} trustDevice={trustDevice} />
          </form>
          <div className="mt-6 text-center text-sm text-slate-300">
            <p>
              Need an account?{' '}
              <Link href="/signup" className="font-semibold text-indigo-200 hover:text-indigo-100">
                Create one here
              </Link>
            </p>
            <ResetPasswordButton email={email} setFeedback={setFeedback} />
          </div>
        </AuthCard>

      {/* Magic Link and Reset Password Buttons as components for clarity */}
    </>
  )
}

function MagicLinkButton({ email, setFeedback, trustDevice }: { email: string, setFeedback: Dispatch<SetStateAction<{ type: 'error' | 'success'; message: string } | null>>, trustDevice?: boolean }) {
  const [sending, setSending] = useState(false)
  return (
    <button
      type="button"
      disabled={sending}
      className="w-full rounded-md bg-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60 mt-2"
      onClick={async () => {
        if (!email) {
          setFeedback({ type: 'error', message: 'Enter your email above and try again to request a magic link.' })
          return
        }
        setSending(true)
        setFeedback(null)
        // Send magic link to the new /verify route so the app can display a
        // clear verification UX and avoid sending users to a nonexistent page.
  const redirectUrl = getAuthRedirectUrl(`/verify?method=magic${trustDevice ? '&trusted=1' : ''}`)
  const otpResp = await fetch('/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, action: 'magic', redirect: redirectUrl }),
  })
  const otpJson = await otpResp.json().catch(() => null)
        setSending(false)
        if (!otpResp.ok) {
          setFeedback({ type: 'error', message: otpJson?.error || 'Failed to send magic link' })
        } else {
          setFeedback({ type: 'success', message: 'Magic link sent! Check your inbox.' })
        }
      }}
    >
      {sending ? 'Sending magic link...' : 'Sign in with magic link'}
    </button>
  )
}

function ResetPasswordButton({ email, setFeedback }: { email: string, setFeedback: Dispatch<SetStateAction<{ type: 'error' | 'success'; message: string } | null>> }) {
  const [sending, setSending] = useState(false)
  return (
    <button
      type="button"
      disabled={sending}
      className="mt-4 text-sm font-medium text-indigo-200 hover:text-indigo-100 transition disabled:opacity-60"
      onClick={async () => {
        if (!email) {
          setFeedback({ type: 'error', message: 'Enter your email above and try again to request a reset link.' })
          return
        }
        setSending(true)
        setFeedback(null)
        // Redirect to /verify after password reset so user sees a confirmation
        const resetResp = await fetch('/api/auth/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'reset' }),
        })
        const resetJson = await resetResp.json().catch(() => null)
        setSending(false)
        if (!resetResp.ok) {
          setFeedback({ type: 'error', message: resetJson?.error || 'Failed to send reset link' })
        } else {
          setFeedback({ type: 'success', message: 'Reset link sent! Check your inbox.' })
        }
      }}
    >
      {sending ? 'Sending reset link...' : 'Forgot password?'}
    </button>
  )
}
