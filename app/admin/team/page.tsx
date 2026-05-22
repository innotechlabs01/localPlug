'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'

interface TeamMember {
  id: number; name: string; email: string; roles: string
  status: string; orders_assigned: number; last_login_at: string; created_at: string
}

const theme = {
  bg: '#0b0d14', surface: '#181b25', surfaceHover: '#202330', border: '#282b38', borderLight: '#1e2130',
  fg: '#f0f2f5', fgSecondary: '#9ca0b0', fgMuted: '#646880',
  accent: '#10b981', accentSoft: 'rgba(16,185,129,0.12)',
  warning: '#f59e0b', warningSoft: 'rgba(245,158,11,0.12)',
  danger: '#ef4450', dangerSoft: 'rgba(239,68,80,0.12)',
  info: '#3b82f6', infoSoft: 'rgba(59,130,246,0.12)',
  gold: '#d4a84b',
  radiusSm: '6px', radiusMd: '10px',
}

export default function TeamPage() {
  const { t } = useI18n()
  const d = t.admin.team
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(data => { setMembers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const selected = useMemo(() => members.find(m => m.id === selectedId), [members, selectedId])

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    admin: members.filter(m => m.roles?.includes('admin')).length,
    totalOrders: members.reduce((s, m) => s + (m.orders_assigned || 0), 0),
  }), [members])

  const filtered = useMemo(() => members.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'all') return true
    if (filter === 'active') return m.status === 'active'
    if (filter === 'inactive') return m.status === 'inactive'
    if (filter === 'admin') return m.roles?.includes('admin')
    if (filter === 'manager') return m.roles?.includes('manager')
    if (filter === 'concierge') return m.roles?.includes('concierge')
    return true
  }), [members, search, filter])

  const getInit = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const getAvatarColor = (name: string) => {
    const hash = name.charCodeAt(0) || 0
    const cs = ['#10b981', '#3b82f6', '#d4a84b', '#6366f1', '#059669', '#0f172a']
    return `linear-gradient(135deg, ${cs[hash % cs.length]}, #0f172a)`
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-[rgba(139,92,246,0.12)] text-[#8b5cf6]',
    manager: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
    concierge: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
    viewer: 'bg-[rgba(100,104,128,0.12)] text-[#646880]',
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#646880]">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[#f0f2f5] tracking-tight">{d.title || 'Team'}</h1>
          <p className="text-[13px] text-[#646880] mt-1.5 max-w-[760px] leading-relaxed">
            {d.subtitle?.replace('{count}', String(stats.total)) || `${stats.total} team members`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all">
            {d.addMember || '+ Add Member'}
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Total', String(stats.total), 'Team members'],
          ['Active', String(stats.active), 'Currently working'],
          ['Admins', String(stats.admin), 'Management'],
          ['Orders', String(stats.totalOrders), 'All assigned'],
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-[#181b25] border border-[#282b38] rounded-xl p-4">
            <p className="text-[11px] text-[#646880] uppercase tracking-wide">{label}</p>
            <p className="text-[24px] font-bold text-[#f0f2f5] mt-1">{value}</p>
            <p className="text-[11px] text-[#10b981] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4 items-start">
        {/* ── Left: Table ── */}
        <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] font-bold text-[#f0f2f5]">Team Members</span>
              <span className="text-[12px] text-[#646880] font-medium">{filtered.length} shown</span>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#646880]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="w-[200px] pl-9 pr-3 py-1.5 bg-[#0b0d14] border border-[#282b38] rounded-lg text-[12px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all"
                placeholder="Search team..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-4 py-2 border-b border-[#1e2130] flex-wrap">
            {['all', 'active', 'inactive', 'admin', 'manager', 'concierge'].map(f => (
              <button key={f}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                  filter === f
                    ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[#10b981]'
                    : 'bg-transparent text-[#646880] border-[#282b38] hover:border-[#10b981] hover:text-[#f0f2f5]'
                }`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.02)]">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Member</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Role</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Orders</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-[#646880] text-[13px]">No team members found</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id}
                    className="border-b border-[#1e2130] hover:bg-[#0b0d14] cursor-pointer transition-colors"
                    onClick={() => setSelectedId(m.id)}
                    style={{ background: selectedId === m.id ? theme.surfaceHover : '' }}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                          style={{ background: getAvatarColor(m.name) }}>
                          {getInit(m.name)}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[#f0f2f5]">{m.name}</div>
                          <div className="text-[12px] text-[#646880]">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleColors[m.roles?.split(',')[0] || 'viewer']}`}>
                        {m.roles?.split(',')[0] || 'viewer'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        m.status === 'active'
                          ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                          : 'bg-[rgba(100,104,128,0.15)] text-[#646880]'
                      }`}>
                        {m.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#9ca0b0]">{m.orders_assigned || 0}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[#9ca0b0]">
                      {m.last_login_at ? new Date(m.last_login_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Side Panel ── */}
        <div className="space-y-4 sticky top-20">
          <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
              <span className="text-[14px] font-bold text-[#f0f2f5]">Member Profile</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-8">Select a member to view profile</p>
              ) : (
                <>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center text-white font-bold text-[20px] flex-shrink-0"
                      style={{ background: getAvatarColor(selected.name) }}>
                      {getInit(selected.name)}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-[#f0f2f5]">{selected.name}</h2>
                      <p className="text-[12px] text-[#646880]">{selected.roles?.split(',')[0] || '—'}</p>
                      <span className={`mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        selected.status === 'active'
                          ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                          : 'bg-[rgba(100,104,128,0.15)] text-[#646880]'
                      }`}>{selected.status || '—'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Email', selected.email],
                      ['Role', selected.roles?.split(',')[0] || '—'],
                      ['Orders Assigned', String(selected.orders_assigned || 0)],
                      ['Last Active', selected.last_login_at ? new Date(selected.last_login_at).toLocaleDateString() : '—'],
                      ['Joined', selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <label className="block text-[10px] text-[#646880] uppercase tracking-wider mb-1">{label}</label>
                        <div className="text-[13px] text-[#f0f2f5]">{value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
              <span className="text-[14px] font-bold text-[#f0f2f5]">Activity</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-4">No member selected</p>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { dot: theme.accent, text: 'Last login', time: selected.last_login_at ? new Date(selected.last_login_at).toLocaleDateString() : '—' },
                    { dot: theme.info, text: `${selected.orders_assigned || 0} orders assigned`, time: 'Current' },
                    { dot: theme.warning, text: 'Member since', time: selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—' },
                  ].map((act, i) => (
                    <div key={i} className="grid grid-cols-[10px_1fr_auto] gap-2.5 items-start pb-2.5 border-b border-[#1e2130] last:border-b-0 last:pb-0">
                      <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: act.dot }} />
                      <div className="text-[13px] text-[#f0f2f5]">{act.text}</div>
                      <div className="text-[11px] text-[#646880] whitespace-nowrap">{act.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
