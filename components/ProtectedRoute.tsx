import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@supabase/auth-helpers-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useUser()
  const router = useRouter()

  // Only redirect when we know the user is explicitly signed out (null).
  // During initial app hydration the auth helper may briefly return undefined
  // — in that case we should wait instead of redirecting to /login which can
  // cause a visible redirect loop when navigating between client-side pages.
  useEffect(() => {
    if (user === null) {
      router.push('/login')
    }
  }, [user, router])

  // Show a loading indicator while the auth state is being rehydrated.
  if (typeof user === 'undefined') return <div>Loading...</div>

  // If user is explicitly null we already triggered the redirect above —
  // render a small placeholder while the router navigates.
  if (user === null) return <div>Redirecting...</div>

  return <>{children}</>
}
