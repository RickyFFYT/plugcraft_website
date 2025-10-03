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
    <div className="flex flex-col">
      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Admin sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${active === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/3'}`}
            aria-current={active === t.id}
          >
            {t.label}
            {active === t.id && (
              <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 block w-8 h-1 rounded bg-indigo-400 shadow"></span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-4">
        {/* panel container with subtle fade-in */}
        <div className="transition-opacity duration-300 ease-out">
          {/* tab panels are handled by parent rendering the right component */}
        </div>
      </div>
    </div>
  )
}
