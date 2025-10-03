import React, { useMemo, useState } from 'react'

interface UserRow {
  id: string
  email: string
  full_name?: string
  last_sign_in_at?: string
  is_admin?: boolean
  profile_id?: string
  disabled?: boolean
  banned_until?: string | null
  quota_limit?: number | null
  usage_window?: {
    total_used_seconds?: number
    max_usage_seconds?: number
    window_seconds?: number
    window_start?: string | null
  } | null
  recent_usage?: Array<{ type: string; amount: number; created_at: string; meta?: any }> | null
}

interface Props {
  users: UserRow[]
  onAction: (action: string, userId: string, extra?: any) => void
}

export default function AdminUsers({ users, onAction }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => (u.email || '').toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q))
  }, [users, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = filtered.slice((page - 1) * pageSize, page * pageSize)

  function gotoPage(p: number) {
    const next = Math.max(1, Math.min(pageCount, p))
    setPage(next)
  }

  return (
    <section className="glass-card p-6 shadow-2xl border border-white/10">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg text-white">Users</h2>
        <div className="flex items-center gap-2">
          <input placeholder="Search by email or name" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} className="p-2 rounded bg-white/5 text-white text-sm" />
        </div>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="w-full table-auto text-left text-sm">
          <thead>
            <tr className="text-slate-300">
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Last sign-in</th>
              <th className="px-2 py-2">Usage</th>
              <th className="px-2 py-2">Admin</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {current.map((u) => {
              const used = u.usage_window?.total_used_seconds || 0
              const max = u.usage_window?.max_usage_seconds || (u.quota_limit ? u.quota_limit * 60 : 0)
              const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0
              return (
                <React.Fragment key={u.id}>
                  <tr className="border-t border-white/5">
                    <td className="px-2 py-2 text-slate-200">{u.email}</td>
                    <td className="px-2 py-2 text-slate-200">{u.full_name || '-'}</td>
                    <td className="px-2 py-2 text-slate-200">{u.last_sign_in_at || '-'}</td>
                    <td className="px-2 py-2" style={{ minWidth: 200 }}>
                      <div className="w-full bg-white/5 rounded overflow-hidden h-3">
                        <div className="bg-indigo-500 h-3" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-slate-300">{used} / {max} seconds ({pct}%)</div>
                    </td>
                    <td className="px-2 py-2">{u.is_admin ? <span className="text-emerald-300">Yes</span> : <span className="text-slate-400">No</span>}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        {!u.is_admin && (
                          u.disabled ? (
                            <button onClick={() => onAction('unban', u.id)} className="px-3 py-1 rounded bg-emerald-500 text-white">Unban</button>
                          ) : (
                            <button onClick={() => onAction('ban', u.id)} className="px-3 py-1 rounded bg-rose-500 text-white">Ban</button>
                          )
                        )}
                        <button onClick={() => setExpanded(prev => ({ ...prev, [u.id]: !prev[u.id] }))} className="px-3 py-1 rounded bg-white/5 text-white">{expanded[u.id] ? 'Hide' : 'View usage'}</button>
                        <button onClick={() => { if (confirm('Delete user? This is irreversible')) onAction('delete', u.id) }} className="px-3 py-1 rounded bg-rose-700 text-white">Delete</button>
                      </div>
                    </td>
                  </tr>
                  {expanded[u.id] && (
                    <tr className="bg-white/2">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-semibold text-white">Recent usage</div>
                            {(!u.recent_usage || u.recent_usage.length === 0) ? (
                              <div className="text-sm text-slate-300 mt-2">No recent usage</div>
                            ) : (
                              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                                {u.recent_usage!.map((r, i) => (
                                  <li key={i} className="p-2 bg-white/3 rounded">{new Date(r.created_at).toLocaleString()} — {r.type} ({r.amount})</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">Quota & window</div>
                            <div className="mt-2 text-sm text-slate-200">Profile quota: {u.quota_limit ?? 'default'}</div>
                            <div className="mt-1 text-sm text-slate-200">Window: {u.usage_window ? `${u.usage_window.window_seconds} seconds` : 'not set'}</div>
                            <div className="mt-2">
                              <button onClick={() => {
                                const newQuota = parseInt(prompt('New quota (number of seconds, or minutes?) (enter integer)') || '', 10)
                                if (!newQuota) return
                                onAction('set_quota', u.id, { quota: newQuota })
                              }} className="mr-2 px-3 py-1 rounded bg-indigo-600 text-white">Set quota</button>
                              <button onClick={() => {
                                const max = parseInt(prompt('Max usage seconds (integer)') || '', 10)
                                const win = parseInt(prompt('Window seconds (integer)') || '', 10)
                                if (!max || !win) return
                                onAction('set_window', u.id, { max_usage_seconds: max, window_seconds: win })
                              }} className="px-3 py-1 rounded bg-indigo-500 text-white">Set window</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-300">Showing {Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(filtered.length, page * pageSize)} of {filtered.length}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => gotoPage(page - 1)} disabled={page <= 1} className="px-3 py-1 rounded bg-white/5 text-white disabled:opacity-40">Prev</button>
          <div className="text-sm text-slate-200">Page {page} / {pageCount}</div>
          <button onClick={() => gotoPage(page + 1)} disabled={page >= pageCount} className="px-3 py-1 rounded bg-white/5 text-white disabled:opacity-40">Next</button>
        </div>
      </div>
    </section>
  )
}
