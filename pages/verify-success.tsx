import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function VerifySuccess() {
  const router = useRouter()
  const [message, setMessage] = useState('Verifying...')

  useEffect(() => {
    // Supabase handles email confirmation server-side when the user hits the link.
    // We simply show confirmation and provide a link to login.
    setMessage('Your email has been verified successfully. You can now log in.')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 border rounded shadow">
        <h2 className="text-xl font-bold mb-4">Email verified</h2>
        <p className="mb-4">{message}</p>
        <a href="/login" className="bg-blue-600 text-white p-2 rounded">Proceed to login</a>
      </div>
    </div>
  )
}
