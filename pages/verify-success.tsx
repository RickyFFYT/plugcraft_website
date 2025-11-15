import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function VerifySuccess() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the centralized verify page
    router.replace('/verify')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 border rounded shadow text-center">
        <h2 className="text-xl font-bold mb-4">Redirecting…</h2>
        <p>If you are not redirected automatically, <Link href="/verify" className="text-indigo-600 underline">click here</Link>.</p>
      </div>
    </div>
  )
}
