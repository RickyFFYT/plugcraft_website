import React from 'react'

interface Tab {
  id: string
  label: string
}

interface AdminTabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export default function AdminTabs({ tabs, active, onChange }: AdminTabsProps) {
  return (
    <div className="admin-liquid-tabs">
      <nav className="flex flex-wrap gap-3 justify-center" aria-label="Admin sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 ease-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 ${
              active === t.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 border-2 border-indigo-400/50'
                : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/10'
            }`}
            aria-current={active === t.id}
          >
            <span className="relative z-10 flex items-center gap-2">
              {t.label}
              {active === t.id && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            {active === t.id && (
              <>
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 animate-pulse" />
                <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-8">
        {/* Enhanced panel container with liquid glass effect */}
        <div className="transition-all duration-500 ease-out transform">
          {/* tab panels are handled by parent rendering the right component */}
        </div>
      </div>
    </div>
  )
}
