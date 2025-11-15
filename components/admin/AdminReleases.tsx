import React, { useMemo, useState } from 'react'

interface Props {
  settings: Array<{ key: string; value: unknown }>
  onSave: (value: Record<string, unknown>) => Promise<void>
}

export default function AdminReleases({ settings, onSave }: Props) {
  const current = useMemo(() => {
    const s = (settings || []).find(x => x.key === 'latest_release')
    return (s?.value as { name: string; version: string; notes: string; download_url: string }) || { name: 'Ghosted', version: '', notes: '', download_url: '' }
  }, [settings])

  const [form, setForm] = useState<{ name: string; version: string; notes: string; download_url: string }>({ name: 'Ghosted', version: '', notes: '', download_url: '' })
  // Keep form synced if settings change externally
  React.useEffect(() => {
    setForm({ ...current })
  }, [current])

  const [saving, setSaving] = useState(false)

  async function save(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
      alert('Release saved')
    } catch (err: unknown) {
      alert('Save failed: ' + ((err as Error)?.message || 'unknown'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="glass-card p-6 shadow-2xl border border-white/10">
      <h2 className="font-semibold text-lg text-white">Releases</h2>
      <form onSubmit={save} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <input className="p-3 rounded-lg bg-white/5 text-white" placeholder="Software name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="p-3 rounded-lg bg-white/5 text-white" placeholder="Version (e.g. 1.2.3)" value={form.version || ''} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          <input className="p-3 rounded-lg bg-white/5 text-white" placeholder="Download URL" value={form.download_url || ''} onChange={(e) => setForm({ ...form, download_url: e.target.value })} />
          <textarea className="p-3 rounded-lg bg-white/5 text-white h-28" placeholder="Release notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex-1 flex flex-col overflow-auto">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white w-full">{saving ? 'Saving…' : 'Save release'}</button>
            <p className="mt-2 text-sm text-slate-300">This release information populates the dashboard download button and the public settings API.</p>
          </div>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="text-sm text-slate-300">Current release</h3>
        <div className="mt-2 p-3 bg-white/3 rounded">
          <div className="font-semibold text-white">{current.name} {current.version}</div>
          <div className="mt-1 text-sm text-slate-300">{current.notes}</div>
          <div className="mt-2 text-xs text-slate-400">Download URL: {current.download_url || 'Not set'}</div>
        </div>
      </div>
    </section>
  )
}
