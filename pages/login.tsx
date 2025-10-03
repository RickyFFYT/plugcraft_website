import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

// Use public assets for logos
const GhostedLogo = '/assets/Ghosted_logo.png'
const SoftwareLogo = '/assets/software_logo.png'

export default function LoginPage() {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

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
        const redirectUrl = `${window.location.origin}/verify?method=magic&email=${encodeURIComponent(email)}`
        const { error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectUrl },
        })
        if (error) {
          setFeedback({ type: 'error', message: error.message })
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
      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setFeedback({ type: 'error', message: signInError.message })
        setLoading(false)
        return
      }

      const signedInUser = data?.user

      if (!signedInUser || !signedInUser.email_confirmed_at) {
        await supabaseClient.auth.signOut()
        const { error: resendError } = await supabaseClient.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/verify?method=confirm&email=${encodeURIComponent(email)}` },
        })

        if (resendError) {
          setFeedback({ type: 'error', message: 'Signed in but email not verified — failed to send verification email. Please contact support.' })
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
        const redirectUrl = `${window.location.origin}/verify?method=device&device_id=${encodeURIComponent(tokenJson.device_id)}&token=${encodeURIComponent(tokenJson.token)}&email=${encodeURIComponent(email)}`
        const { error: otpError } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl } })
        if (otpError) {
          setFeedback({ type: 'error', message: otpError.message })
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
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Sign in failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Log in | Ghosted</title>
      </Head>
      <div className="flex min-h-[calc(100vh-136px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-500/20">
          <div className="flex flex-col items-center gap-2 mb-4">
            <img src={GhostedLogo} alt="Ghosted Logo" className="h-12" />
            <img src={SoftwareLogo} alt="Ghosted Software Logo" className="h-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-300">Sign in to manage your Ghosted downloads and usage.</p>
          </div>
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <input id="trust-device" type="checkbox" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black/40" />
              <label htmlFor="trust-device" className="text-slate-300">Trust this device for 30 days (required to sign-in with password)</label>
            </div>
            {feedback && (
              <p className={`text-sm ${feedback.type === 'error' ? 'text-rose-200' : 'text-emerald-200'} transition-all duration-300`}>{feedback.message}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <MagicLinkButton email={email} setFeedback={setFeedback} supabaseClient={supabaseClient} trustDevice={trustDevice} />
          </form>
          <div className="mt-6 text-center text-sm text-slate-300">
            <p>
              Need an account?{' '}
              <Link href="/signup" className="font-semibold text-indigo-200 hover:text-indigo-100">
                Create one here
              </Link>
            </p>
            <ResetPasswordButton email={email} setFeedback={setFeedback} supabaseClient={supabaseClient} />
          </div>
        </div>
      </div>

      {/* Magic Link and Reset Password Buttons as components for clarity */}
    </>
  )
}

function MagicLinkButton({ email, setFeedback, supabaseClient, trustDevice }: { email: string, setFeedback: any, supabaseClient: any, trustDevice?: boolean }) {
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
        const redirectUrl = `${window.location.origin}/verify?method=magic&email=${encodeURIComponent(email)}${trustDevice ? '&trusted=1' : ''}`
        const { error } = await supabaseClient.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl } })
        setSending(false)
        if (error) {
          setFeedback({ type: 'error', message: error.message })
        } else {
          setFeedback({ type: 'success', message: 'Magic link sent! Check your inbox.' })
        }
      }}
    >
      {sending ? 'Sending magic link...' : 'Sign in with magic link'}
    </button>
  )
}

function ResetPasswordButton({ email, setFeedback, supabaseClient }: { email: string, setFeedback: any, supabaseClient: any }) {
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
        const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/verify?method=reset&email=${encodeURIComponent(email)}`,
        })
        setSending(false)
        if (resetError) {
          setFeedback({ type: 'error', message: resetError.message })
        } else {
          setFeedback({ type: 'success', message: 'Reset link sent! Check your inbox.' })
        }
      }}
    >
      {sending ? 'Sending reset link...' : 'Forgot password?'}
    </button>
  )
}
