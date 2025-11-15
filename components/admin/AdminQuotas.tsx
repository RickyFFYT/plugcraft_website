import React, { useMemo, useState } from 'react'
import { extractErrorMessage } from '../../lib/utils'
import type { SiteSetting } from '../../lib/types'

interface Props {
  settings: SiteSetting[]
  onSave: (key: string, value: unknown) => Promise<void>
}

export default function AdminQuotas({ settings, onSave }: Props) {
  const defaults = useMemo(() => {
    const dq = (settings || []).find((s) => s.key === 'default_quota_limit')
    const dw = (settings || []).find((s) => s.key === 'default_window_seconds')
    return {
      default_quota_limit: String(dq?.value ?? 100),
      default_window_seconds: String(dw?.value ?? 18000)
    }
  }, [settings])

  const [form, setForm] = useState<{ default_quota_limit: number | string; default_window_seconds: number | string }>({ ...defaults })
  const [saving, setSaving] = useState(false)

  React.useEffect(() => setForm({ ...defaults }), [defaults])

  async function saveAll(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await onSave('default_quota_limit', Number(form.default_quota_limit))
      await onSave('default_window_seconds', Number(form.default_window_seconds))
      alert('Defaults saved')
    } catch (err: unknown) {
      const msg = extractErrorMessage(err)
      alert('Save failed: ' + (msg || 'unknown'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="glass-card p-6 shadow-2xl border border-white/10">
      <h2 className="font-semibold text-lg text-white">Quota defaults</h2>
      <form onSubmit={saveAll} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <label className="text-sm text-slate-300">Default quota limit (seconds)</label>
          <input className="p-3 rounded-lg bg-white/5 text-white" value={form.default_quota_limit} onChange={(e) => setForm({ ...form, default_quota_limit: e.target.value })} />
          <label className="text-sm text-slate-300">Default window seconds</label>
          <input className="p-3 rounded-lg bg-white/5 text-white" value={form.default_window_seconds} onChange={(e) => setForm({ ...form, default_window_seconds: e.target.value })} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex-1 flex flex-col overflow-auto">
            <button disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white w-full">{saving ? 'Saving…' : 'Save defaults'}</button>
            <p className="mt-2 text-sm text-slate-300">These defaults will be applied for new users or used as fallbacks when profiles do not have explicit quota/window settings.</p>
          </div>
        </div>
      </form>
    </section>
  )
}
