import React, { useMemo, useState } from 'react'
import type { UserRow } from '../../lib/types'

interface Props {
  users: UserRow[]
  onAction: (action: string, userId: string, extra?: Record<string, unknown> | null) => void
}

export default function AdminUsers({ users, onAction }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [banModal, setBanModal] = useState<{ userId: string; email: string } | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banUntil, setBanUntil] = useState('')

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
  <div className="glass-panel">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          User Management
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">
            Showing {Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(filtered.length, page * pageSize)} of {filtered.length} users
          </div>
          <input
            placeholder="Search by email or name"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            className="glass-card text-white placeholder-slate-400 bg-transparent border-white/20 focus:border-indigo-400/50 focus:ring-indigo-400/30"
            style={{ minWidth: '250px' }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full table-auto text-left text-sm">
          <thead className="bg-gradient-to-r from-slate-800/50 to-slate-700/50">
            <tr className="text-slate-300 border-b border-white/10">
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Usage</th>
              <th className="px-6 py-4 font-semibold">Last Activity</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {current.map((u) => {
              const used = u.usage_window?.total_used_seconds || 0
              const max = u.usage_window?.max_usage_seconds || (u.quota_limit ? u.quota_limit * 60 : 0)
              const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0
              const isBanned = u.disabled || (u.banned_until && new Date(u.banned_until) > new Date())
              return (
                <React.Fragment key={u.id}>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {(u.full_name || u.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">{u.full_name || 'No name'}</div>
                          <div className="text-slate-400 text-sm">{u.email}</div>
                          {u.is_admin && <span className="inline-block mt-1 px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">Admin</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isBanned ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 text-sm rounded-full">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Banned
                          </span>
                          {u.banned_until && (
                            <div className="text-xs text-slate-400">
                              Until: {new Date(u.banned_until).toLocaleDateString()}
                            </div>
                          )}
                          {u.ban_reason && (
                            <div className="text-xs text-slate-400 max-w-32 truncate" title={u.ban_reason}>
                              Reason: {u.ban_reason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm rounded-full">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4" style={{ minWidth: 200 }}>
                      <div className="space-y-2">
                        <div className="w-full bg-white/10 rounded-full overflow-hidden h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${pct > 80 ? 'bg-gradient-to-r from-rose-500 to-red-600' : pct > 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-green-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>{Math.round(used / 60)}m used</span>
                          <span>{Math.round(max / 60)}m limit</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {!u.is_admin && (
                          isBanned ? (
                            <button
                              onClick={() => onAction('unban', u.id)}
                              className="glass-card bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/30 hover:border-emerald-400/50"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => setBanModal({ userId: u.id, email: u.email })}
                              className="glass-card bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-400/30 hover:border-rose-400/50"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              Ban
                            </button>
                          )
                        )}
                        <button
                          onClick={() => setExpanded(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                          className="glass-card bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border-slate-400/30 hover:border-slate-400/50"
                        >
                          <svg className={`w-4 h-4 mr-2 transition-transform ${expanded[u.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {expanded[u.id] ? 'Hide' : 'Details'}
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete user? This is irreversible')) onAction('delete', u.id) }}
                          className="glass-card bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-400/30 hover:border-red-400/50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
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

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Ban User</h3>
            <p className="text-slate-300 mb-4">Banning user: <span className="text-white font-semibold">{banModal.email}</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reason (optional)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for ban..."
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ban until (optional)</label>
                <input
                  type="datetime-local"
                  value={banUntil}
                  onChange={(e) => setBanUntil(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">Leave empty for permanent ban</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  onAction('ban', banModal.userId, { reason: banReason || null, until: banUntil || null })
                  setBanModal(null)
                  setBanReason('')
                  setBanUntil('')
                }}
                className="flex-1 glass-card bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-400/30 hover:border-rose-400/50"
              >
                Confirm Ban
              </button>
              <button
                onClick={() => {
                  setBanModal(null)
                  setBanReason('')
                  setBanUntil('')
                }}
                className="flex-1 glass-card bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border-slate-400/30 hover:border-slate-400/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
