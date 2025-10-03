import React from 'react'

interface Props {
  settings: any[]
  onToggleLock: () => void
}

export default function AdminSettings({ settings, onToggleLock }: Props) {
  const locked = settings.find((s: any) => s.key === 'software_locked')?.value?.value || false
  const version = settings.find((s: any) => s.key === 'current_version')?.value?.value || '0.0.0'
  const [newVersion, setNewVersion] = React.useState('')
  const [forceShutdown, setForceShutdown] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  return (
    <section className="glass-card p-6 shadow-2xl border border-white/10">
      <h2 className="font-semibold text-lg text-white">Site Settings</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="p-4 rounded bg-white/3">
          <div className="text-sm text-slate-300">Software locked</div>
          <div className="mt-1 text-lg font-semibold text-white">{locked ? 'Locked' : 'Unlocked'}</div>
          <button onClick={onToggleLock} className="mt-3 px-4 py-2 rounded bg-indigo-600 text-white">Toggle Lock</button>
        </div>

        <div className="p-4 rounded bg-white/3">
          <div className="text-sm text-slate-300">Current version</div>
          <div className="mt-1 text-lg font-semibold text-white">{version}</div>
          <div className="mt-3 flex gap-2">
            <input placeholder="e.g. 1.2.3" value={newVersion} onChange={(e) => setNewVersion(e.target.value)} className="p-2 rounded bg-white/5 text-white text-sm" />
            <label className="inline-flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={forceShutdown} onChange={(e) => setForceShutdown(e.target.checked)} /> Force shutdown</label>
            <button onClick={async () => {
              if (!newVersion) { setMessage('Please enter a version'); return }
              setMessage(null)
              try {
                const res = await fetch('/api/admin/updates', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ version: newVersion, force_shutdown: forceShutdown }) })
                const j = await res.json()
                if (!res.ok) {
                  setMessage(j?.error || 'Failed to publish update')
                } else {
                  setMessage('Update published')
                }
              } catch (e) {
                setMessage('Network error')
              }
            }} className="ml-2 px-3 py-1 rounded bg-emerald-600 text-white">Publish</button>
          </div>
          {message && <div className="mt-2 text-sm text-slate-300">{message}</div>}
        </div>
      </div>
    </section>
  )
}
