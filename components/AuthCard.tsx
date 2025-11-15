import { ReactNode } from 'react'
import Image from 'next/image'

interface AuthCardProps {
  title?: string
  subtitle?: string
  children?: ReactNode
  leftGraphic?: ReactNode
}

export default function AuthCard({ title, subtitle, children, leftGraphic }: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-136px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6 glass-card force-sheen p-6 shadow-2xl border border-white/10">
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-10 flex flex-col justify-center items-start bg-gradient-to-br from-indigo-600 to-fuchsia-500">
          <div className="absolute inset-0 opacity-40 mix-blend-screen blur-3xl -z-10" aria-hidden="true" />
          <div className="flex items-center gap-3 mb-4">
            <Image src="/assets/Ghosted_logo.png" alt="Ghosted Logo" width={64} height={64} className="rounded-md bg-transparent" />
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">{title || 'Welcome'}</h2>
              {subtitle && <p className="text-sm text-white/90 mt-1 max-w-xs">{subtitle}</p>}
            </div>
          </div>
          <div className="mt-6 text-white/90 text-sm space-y-3">
            <div className="flex items-start gap-3">
              <span className="inline-grid place-items-center w-8 h-8 rounded bg-white/20 text-white">✓</span>
              <div>
                <div className="font-semibold">Easy access</div>
                <div className="text-sm opacity-90">One-click magic link available</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-grid place-items-center w-8 h-8 rounded bg-white/20 text-white">⚡</span>
              <div>
                <div className="font-semibold">Fast downloads</div>
                <div className="text-sm opacity-90">Get signed downloads instantly</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-grid place-items-center w-8 h-8 rounded bg-white/20 text-white">🔒</span>
              <div>
                <div className="font-semibold">Secure accounts</div>
                <div className="text-sm opacity-90">Hardened auth and device trust</div>
              </div>
            </div>
          </div>
          {leftGraphic && <div className="mt-6 w-full">{leftGraphic}</div>}
        </div>

        <div className="p-6 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            {children}
          </div>
          <div className="mt-4 text-center text-slate-300 text-sm">
            <div>By continuing you agree to our <a href="#" className="underline text-white/90">Terms</a> and <a href="#" className="underline text-white/90">Privacy</a>.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
