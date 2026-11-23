'use client'

import { useState, useEffect, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { RealtimeProvider } from '@/lib/admin/realtime-context'
import { useToast } from '@/lib/admin/toast-context'

interface TeamMember {
  id: number; name: string; email: string; roles: string
  status: string; orders_assigned: number; last_login_at: string; created_at: string
}

interface Role {
  id: number; name: string; description: string
}

const theme = {
  bg: 'var(--bg)', surface: 'var(--surface)', surfaceHover: 'var(--surface-hover)', border: 'var(--border)', borderLight: 'var(--surface-active)',
  fg: 'var(--fg)', fgSecondary: 'var(--fg-muted)', fgMuted: 'var(--fg-secondary)',
  accent: 'var(--accent)', accentSoft: 'rgba(16,185,129,0.12)',
  warning: 'var(--warning)', warningSoft: 'rgba(245,158,11,0.12)',
  danger: 'var(--danger)', dangerSoft: 'rgba(239,68,80,0.12)',
  info: 'var(--info)', infoSoft: 'rgba(59,130,246,0.12)',
  gold: 'var(--gold)',
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
  const [modalOpen, setModalOpen] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [form, setForm] = useState<Record<string, string>>({})
  const [wizardStep, setWizardStep] = useState(1)
  const { showToast } = useToast()

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/team').then(r => r.json()),
      adminFetch('/api/admin/team/roles').then(r => r.json()).catch(() => []),
    ]).then(([data, roleData]) => {
      setMembers(data)
      setRoles(roleData.roles || roleData || [])
      setLoading(false)
    }).catch(() => setLoading(false))
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

  const handleCreate = async () => {
    try {
      if (!form.name || !form.email || !form.role_id) {
        showToast(d.validationRequired || 'Name, email, and role are required')
        return
      }
      const res = await adminFetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, role_id: Number(form.role_id) }),
      })
      if (res.ok) {
        showToast(d.memberCreated || 'Member created')
        setModalOpen(false)
        setForm({})
        const data = await adminFetch('/api/admin/team').then(r => r.json())
        setMembers(data)
      } else {
        const err = await res.json()
        showToast(err.error || d.createFailed || 'Failed to create member')
      }
    } catch {
      showToast(d.createError || 'Error creating member')
    }
  }

  const getAvatarColor = (name: string) => {
    const hash = name.charCodeAt(0) || 0
    const cs = ['var(--accent)', 'var(--info)', 'var(--gold)', 'var(--info)', 'var(--accent-hover)', 'var(--bg)']
    return `linear-gradient(135deg, ${cs[hash % cs.length]}, var(--bg))`
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-[rgba(139,92,246,0.12)] text-[#8b5cf6]',
    manager: 'bg-[rgba(59,130,246,0.12)] text-[#3b82f6]',
    concierge: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
    viewer: 'bg-[rgba(100,104,128,0.12)] text-[#646880]',
  }

  const filterLabels: Record<string, string> = {
    all: d.filterAll || 'All',
    active: d.filterActive || 'Active',
    inactive: d.filterInactive || 'Inactive',
    admin: d.filterAdmin || 'Admin',
    manager: d.filterManager || 'Manager',
    concierge: d.filterConcierge || 'Concierge',
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#646880]">{d.loading || 'Loading...'}</div>
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
          <button className="px-4 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all" onClick={() => setModalOpen(true)}>
            {d.addMember || '+ Add Member'}
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: d.kpiTotal || 'Total', value: String(stats.total), sub: d.kpiTeamMembers || 'Team members' },
          { label: d.kpiActive || 'Active', value: String(stats.active), sub: d.kpiWorking || 'Currently working' },
          { label: d.kpiAdmins || 'Admins', value: String(stats.admin), sub: d.kpiManagement || 'Management' },
          { label: d.kpiOrders || 'Orders', value: String(stats.totalOrders), sub: d.kpiAllAssigned || 'All assigned' },
        ].map(({ label, value, sub }) => (
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
              <span className="text-[14px] font-bold text-[#f0f2f5]">{d.rosterTitle || 'Team Members'}</span>
              <span className="text-[12px] text-[#646880] font-medium">{d.rosterCount?.replace('{count}', String(filtered.length)) || `${filtered.length} shown`}</span>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#646880]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="w-[200px] pl-9 pr-3 py-1.5 bg-[#0b0d14] border border-[#282b38] rounded-lg text-[12px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all"
                placeholder={d.searchPlaceholder || 'Search team...'}
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
                {filterLabels[f] || f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.02)]">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">{d.tableMember || 'Member'}</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">{d.tableRole || 'Role'}</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">{d.tableStatus || 'Status'}</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">{d.tableOrders || 'Orders'}</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">{d.tableLastActive || 'Last Active'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-[#646880] text-[13px]">{d.noResults || 'No team members found'}</td></tr>
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
              <span className="text-[14px] font-bold text-[#f0f2f5]">{d.panelProfile || 'Member Profile'}</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-8">{d.selectPrompt || 'Select a member to view profile'}</p>
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
                      { label: t.common.email || 'Email', value: selected.email },
                      { label: d.tableRole || 'Role', value: selected.roles?.split(',')[0] || '—' },
                      { label: d.ordersAssigned || 'Orders Assigned', value: String(selected.orders_assigned || 0) },
                      { label: d.tableLastActive || 'Last Active', value: selected.last_login_at ? new Date(selected.last_login_at).toLocaleDateString() : '—' },
                      { label: 'Joined', value: selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—' },
                    ].map(({ label, value }) => (
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
              <span className="text-[14px] font-bold text-[#f0f2f5]">{d.panelActivity || 'Activity'}</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-4">{d.noActivity || 'No member selected'}</p>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { dot: theme.accent, text: d.activityLastLogin || 'Last login', time: selected.last_login_at ? new Date(selected.last_login_at).toLocaleDateString() : '—' },
                    { dot: theme.info, text: (d.activityOrders || '{count} orders assigned').replace('{count}', String(selected.orders_assigned || 0)), time: d.activityCurrent || 'Current' },
                    { dot: theme.warning, text: d.activityMemberSince || 'Member since', time: selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—' },
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

      {/* ── Create Modal (matching admin-employees.html wizard) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.62)' }} onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-[760px] max-h-[90vh] overflow-y-auto bg-[#0b0d14] border border-[#282b38] rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#282b38]">
              <h2 className="text-[18px] font-bold text-[#f0f2f5]">{d.addMember || '+ Add Team Member'}</h2>
              <button className="text-[#646880] hover:text-[#f0f2f5]" onClick={() => setModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-5">
              {/* Stepper */}
              <div className="flex gap-2 mb-4">
                <div className={`h-1 flex-1 rounded-full ${wizardStep >= 1 ? 'bg-[#10b981]' : 'bg-[#282b38]'}`} />
                <div className={`h-1 flex-1 rounded-full ${wizardStep >= 2 ? 'bg-[#10b981]' : 'bg-[#282b38]'}`} />
                <div className={`h-1 flex-1 rounded-full ${wizardStep >= 3 ? 'bg-[#10b981]' : 'bg-[#282b38]'}`} />
                <div className={`h-1 flex-1 rounded-full ${wizardStep >= 4 ? 'bg-[#10b981]' : 'bg-[#282b38]'}`} />
              </div>
              <p className="text-[12px] text-[#646880] mb-4">Step {wizardStep} of 4 - {['Personal Information', 'Role & Department', 'Permissions', 'Review'][wizardStep - 1]}</p>


              {/* Step 1: Personal Info */}
              {wizardStep === 1 && (
                <div className="grid grid-cols-2 gap-3 mt-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Full name</label>
                    <input className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors" placeholder="e.g. Laura Giraldo"
                      value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Email</label>
                    <input className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors" placeholder="laura@company.com" type="email"
                      value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Phone number</label>
                    <input className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors" placeholder="+57 300 123 4567"
                      value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Address</label>
                    <input className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors" placeholder="El Poblado, Medellín"
                      value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Step 2: Role & Department */}
              {wizardStep === 2 && (
                <div className="grid grid-cols-2 gap-3 mt-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Department</label>
                    <select className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors"
                      value={form.department || ''} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                      <option value="">Select department...</option>
                      <option>Operations</option><option>Support</option><option>Finance</option><option>Marketing</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Role</label>
                    <select className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors"
                      value={form.role_id || ''} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}>
                      <option value="">Select role...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Work status</label>
                    <select className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors"
                      value={form.employee_status || 'active'} onChange={e => setForm(p => ({ ...p, employee_status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="leave">On Leave</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Office location</label>
                    <input className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors" placeholder="El Poblado HQ"
                      value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Step 3: Permissions */}
              {wizardStep === 3 && (
                <div className="grid grid-cols-2 gap-3 mt-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Role template</label>
                    <input className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors" placeholder="Operations Manager Template"
                      value={form.role_template || ''} onChange={e => setForm(p => ({ ...p, role_template: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#646880]">Last login policy</label>
                    <input className="w-full px-3 py-2.5 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none focus:border-[#10b981] transition-colors" placeholder="Require 90 day audit"
                      value={form.login_policy || ''} onChange={e => setForm(p => ({ ...p, login_policy: e.target.value }))} />
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {wizardStep === 4 && (
                <div className="p-4 bg-[#181b25] border border-[#282b38] rounded-lg mt-3.5 text-[13px] text-[#9ca0b0] leading-relaxed">
                  Review employee profile, department, permissions, and status before creating the account. All actions will be logged in the audit trail.
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {[
                      ['Name', form.name || '—'],
                      ['Email', form.email || '—'],
                      ['Phone', form.phone || '—'],
                      ['Role', roles.find(r => r.id === Number(form.role_id))?.name || form.role_id || '—'],
                      ['Department', form.department || '—'],
                      ['Status', form.employee_status || 'active'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <label className="block text-[10px] text-[#646880] uppercase tracking-wider mb-1">{label}</label>
                        <div className="text-[13px] text-[#f0f2f5]">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between gap-2.5 px-5 py-4 border-t border-[#282b38]">
              <button className="px-4 py-2 border border-[#282b38] text-[13px] text-[#9ca0b0] rounded-lg hover:bg-[#202330] transition-all"
                style={{ display: wizardStep > 1 ? 'block' : 'none' }}
                onClick={() => setWizardStep(s => s - 1)}>{t.common.back || 'Back'}</button>
              <div style={{ flex: 1 }} />
              {wizardStep < 4 ? (
                <button className="px-6 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all" onClick={() => setWizardStep(s => s + 1)}>Next</button>
              ) : (
                <button className="px-6 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all" onClick={handleCreate}>Save</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
