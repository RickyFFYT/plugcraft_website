import React from 'react'
import type { Announcement, NewAnnouncement } from '../../lib/types'

interface Props {
  announcements: Announcement[]
  newAnnouncement: NewAnnouncement
  onChangeNew: (next: NewAnnouncement) => void
  onCreate: (e: React.FormEvent) => void
  onEdit: (id: string, newBody: string) => void
  onDelete: (id: string) => void
}

export default function AdminAnnouncements({ announcements, newAnnouncement, onChangeNew, onCreate, onEdit, onDelete }: Props) {
  return (
    <section className="glass-card p-6 shadow-2xl border border-white/10">
      <h2 className="font-semibold text-lg text-white">Announcements</h2>
      <form onSubmit={onCreate} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <input className="p-3 rounded-lg bg-white/5 text-white" placeholder="Title" value={newAnnouncement.title} onChange={(e) => onChangeNew({ ...newAnnouncement, title: e.target.value })} />
          <textarea className="p-3 rounded-lg bg-white/5 text-white h-28" placeholder="Body" value={newAnnouncement.body} onChange={(e) => onChangeNew({ ...newAnnouncement, body: e.target.value })} />
          <div className="flex gap-2">
            <input type="datetime-local" className="p-2 rounded bg-white/5 text-white" value={newAnnouncement.starts_at} onChange={(e) => onChangeNew({ ...newAnnouncement, starts_at: e.target.value })} />
            <input type="datetime-local" className="p-2 rounded bg-white/5 text-white" value={newAnnouncement.ends_at} onChange={(e) => onChangeNew({ ...newAnnouncement, ends_at: e.target.value })} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex-1 flex flex-col overflow-auto">
            <button className="px-4 py-2 rounded bg-indigo-600 text-white w-full">Create announcement</button>
            <p className="mt-2 text-sm text-slate-300">New announcements will be visible according to the start/end times you provide.</p>
          </div>
        </div>
      </form>

      <div className="mt-6">
        {announcements.length === 0 ? <p className="text-sm text-slate-300">No announcements</p> : (
          <ul className="space-y-3 mt-4">
            {announcements.map((a) => (
              <li key={a.id} className="p-4 bg-white/3 rounded-lg shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="text-lg font-semibold gradient-heading leading-tight">{a.title}</div>
                    <div className="mt-2 text-base text-slate-200 leading-relaxed">{a.body}</div>
                    <div className="mt-3 text-xs text-slate-400">{a.starts_at ? `From: ${new Date(a.starts_at).toLocaleString()}` : ''} {a.ends_at ? ` — To: ${new Date(a.ends_at).toLocaleString()}` : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const updated = prompt('Edit body', a.body)
                      if (!updated) return
                      onEdit(a.id, updated)
                    }} className="px-3 py-1 rounded bg-yellow-600 text-white">Edit</button>
                    <button onClick={() => { if (confirm('Delete announcement?')) onDelete(a.id) }} className="px-3 py-1 rounded bg-rose-600 text-white">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
