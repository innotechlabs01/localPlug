'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface TeamMember {
  id: number; name: string; email: string; roles: string
  status: string; orders_assigned: number; last_login_at: string; created_at: string
}

interface Role {
  id: number; name: string; description: string
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
    const cs = ['var(--ui-accent)', 'var(--ui-info)', 'var(--ui-gold)', 'var(--ui-info)', 'var(--ui-accent)', 'var(--ui-bg)']
    return `linear-gradient(135deg, ${cs[hash % cs.length]}, var(--ui-bg))`
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-[rgba(139,92,246,0.12)] text-[var(--ui-info)]',
    manager: 'bg-[rgba(59,130,246,0.12)] text-[var(--ui-info)]',
    concierge: 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]',
    viewer: 'bg-[rgba(100,104,128,0.12)] text-[var(--ui-fg-muted)]',
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
    return <div className="flex items-center justify-center h-64 text-[var(--ui-fg-muted)]">{d.loading || 'Loading...'}</div>
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--ui-fg)] tracking-tight">{d.title || 'Team'}</h1>
          <p className="text-[13px] text-[var(--ui-fg-muted)] mt-1.5 max-w-[760px] leading-relaxed">
            {d.subtitle?.replace('{count}', String(stats.total)) || `${stats.total} team members`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[var(--ui-accent)] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all" onClick={() => setModalOpen(true)}>
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
          <div key={label} className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] p-4">
            <p className="text-[11px] text-[var(--ui-fg-muted)] uppercase tracking-wide">{label}</p>
            <p className="text-[24px] font-bold text-[var(--ui-fg)] mt-1">{value}</p>
            <p className="text-[11px] text-[var(--ui-accent)] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4 items-start">
        {/* ── Left: Table ── */}
        <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ui-border-light)]">
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] font-bold text-[var(--ui-fg)]">{d.rosterTitle || 'Team Members'}</span>
              <span className="text-[12px] text-[var(--ui-fg-muted)] font-medium">{d.rosterCount?.replace('{count}', String(filtered.length)) || `${filtered.length} shown`}</span>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ui-fg-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="w-[200px] pl-9 pr-3 py-1.5 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg text-[12px] text-[var(--ui-fg)] placeholder:text-[var(--ui-fg-muted)] outline-none focus:border-[var(--ui-accent)] transition-all"
                placeholder={d.searchPlaceholder || 'Search team...'}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-4 py-2 border-b border-[var(--ui-border-light)] flex-wrap">
            {['all', 'active', 'inactive', 'admin', 'manager', 'concierge'].map(f => (
              <button key={f}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                  filter === f
                    ? 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent)] border-[var(--ui-accent)]'
                    : 'bg-transparent text-[var(--ui-fg-muted)] border-[var(--ui-border)] hover:border-[var(--ui-accent)] hover:text-[var(--ui-fg)]'
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
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--ui-fg-muted)] px-4 py-3.5">{d.tableMember || 'Member'}</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--ui-fg-muted)] px-4 py-3.5">{d.tableRole || 'Role'}</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--ui-fg-muted)] px-4 py-3.5">{d.tableStatus || 'Status'}</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--ui-fg-muted)] px-4 py-3.5">{d.tableOrders || 'Orders'}</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--ui-fg-muted)] px-4 py-3.5">{d.tableLastActive || 'Last Active'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-[var(--ui-fg-muted)] text-[13px]">{d.noResults || 'No team members found'}</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id}
                    className="border-b border-[var(--ui-border-light)] hover:bg-[var(--ui-surface-hover)] cursor-pointer transition-colors"
                    onClick={() => setSelectedId(m.id)}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                          style={{ background: getAvatarColor(m.name) }}>
                          {getInit(m.name)}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[var(--ui-fg)]">{m.name}</div>
                          <div className="text-[12px] text-[var(--ui-fg-muted)]">{m.email}</div>
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
                          ? 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]'
                          : 'bg-[rgba(100,104,128,0.15)] text-[var(--ui-fg-muted)]'
                      }`}>
                        {m.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[var(--ui-fg-secondary)]">{m.orders_assigned || 0}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[var(--ui-fg-secondary)]">
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
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ui-border-light)]">
              <span className="text-[14px] font-bold text-[var(--ui-fg)]">{d.panelProfile || 'Member Profile'}</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[var(--ui-fg-muted)] text-center py-8">{d.selectPrompt || 'Select a member to view profile'}</p>
              ) : (
                <>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center text-white font-bold text-[20px] flex-shrink-0"
                      style={{ background: getAvatarColor(selected.name) }}>
                      {getInit(selected.name)}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-[var(--ui-fg)]">{selected.name}</h2>
                      <p className="text-[12px] text-[var(--ui-fg-muted)]">{selected.roles?.split(',')[0] || '—'}</p>
                      <span className={`mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        selected.status === 'active'
                          ? 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]'
                          : 'bg-[rgba(100,104,128,0.15)] text-[var(--ui-fg-muted)]'
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
                        <label className="block text-[10px] text-[var(--ui-fg-muted)] uppercase tracking-wider mb-1">{label}</label>
                        <div className="text-[13px] text-[var(--ui-fg)]">{value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[var(--ui-radius-md)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ui-border-light)]">
              <span className="text-[14px] font-bold text-[var(--ui-fg)]">{d.panelActivity || 'Activity'}</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[var(--ui-fg-muted)] text-center py-4">{d.noActivity || 'No member selected'}</p>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { dot: 'var(--ui-accent)', text: d.activityLastLogin || 'Last login', time: selected.last_login_at ? new Date(selected.last_login_at).toLocaleDateString() : '—' },
                    { dot: 'var(--ui-info)', text: (d.activityOrders || '{count} orders assigned').replace('{count}', String(selected.orders_assigned || 0)), time: d.activityCurrent || 'Current' },
                    { dot: 'var(--ui-warning)', text: d.activityMemberSince || 'Member since', time: selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—' },
                  ].map((act, i) => (
                    <div key={i} className="grid grid-cols-[10px_1fr_auto] gap-2.5 items-start pb-2.5 border-b border-[var(--ui-border-light)] last:border-b-0 last:pb-0">
                      <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: act.dot }} />
                      <div className="text-[13px] text-[var(--ui-fg)]">{act.text}</div>
                      <div className="text-[11px] text-[var(--ui-fg-muted)] whitespace-nowrap">{act.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.62)' }} onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-[760px] max-h-[90vh] overflow-y-auto bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-[var(--ui-radius-lg)] shadow-[var(--ui-shadow-modal)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[var(--ui-border)]">
              <h2 className="text-[18px] font-bold text-[var(--ui-fg)]">{d.addMember || '+ Add Team Member'}</h2>
              <button className="text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)]" onClick={() => setModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-5">
              {/* Stepper */}
              <div className="flex gap-2 mb-4">
                <div className={`h-1 flex-1 rounded-full ${wizardStep >= 1 ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-surface-hover)]'}`} />
                <div className={`h-1 flex-1 rounded-full ${wizardStep >= 2 ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-surface-hover)]'}`} />
                <div className={`h-1 flex-1 rounded-full ${wizardStep >= 3 ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-surface-hover)]'}`} />
                <div className={`h-1 flex-1 rounded-full ${wizardStep >= 4 ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-surface-hover)]'}`} />
              </div>
              <p className="text-[12px] text-[var(--ui-fg-muted)] mb-4">Step {wizardStep} of 4 - {['Personal Information', 'Role & Department', 'Permissions', 'Review'][wizardStep - 1]}</p>

              {/* Step 1: Personal Info */}
              {wizardStep === 1 && (
                <div className="grid grid-cols-2 gap-3 mt-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--ui-fg-muted)]">Full name</label>
                    <input className="w-full px-3 py-2.5 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg text-[13px] text-[var(--ui-fg)] outline-none focus:border-[var(--ui-accent)] transition-colors" placeholder="e.g. Laura Giraldo"
                      value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--ui-fg-muted)]">Email</label>
                    <input className="w-full px-3 py-2.5 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg text-[13px] text-[var(--ui-fg)] outline-none focus:border-[var(--ui-accent)] transition-colors" placeholder="laura@company.com" type="email"
                      value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--ui-fg-muted)]">Role</label>
                    <select className="w-full px-3 py-2.5 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg text-[13px] text-[var(--ui-fg)] outline-none focus:border-[var(--ui-accent)] transition-colors"
                      value={form.role_id || ''} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}>
                      <option value="">Select role</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Wizard steps 2-4 placeholders */}
              {wizardStep === 2 && (
                <div className="space-y-3 mt-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--ui-fg-muted)]">Department</label>
                    <select className="w-full px-3 py-2.5 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg text-[13px] text-[var(--ui-fg)] outline-none focus:border-[var(--ui-accent)] transition-colors">
                      <option value="operations">Operations</option>
                      <option value="management">Management</option>
                      <option value="concierge">Concierge</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--ui-fg-muted)]">Access Level</label>
                    <select className="w-full px-3 py-2.5 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg text-[13px] text-[var(--ui-fg)] outline-none focus:border-[var(--ui-accent)] transition-colors">
                      <option value="full">Full Access</option>
                      <option value="limited">Limited Access</option>
                    </select>
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-3 mt-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--ui-fg-muted)]">Permissions</label>
                    <div className="space-y-1.5">
                      {[
                        { label: 'View Reservations', key: 'view_reservations' },
                        { label: 'Manage Drivers', key: 'manage_drivers' },
                        { label: 'Process Payments', key: 'process_payments' },
                        { label: 'Manage Hotels', key: 'manage_hotels' },
                      ].map(p => (
                        <label key={p.key} className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" className="accent-[var(--ui-accent)] mt-0.5" defaultChecked />
                          <span className="text-[13px] text-[var(--ui-fg)]">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {wizardStep === 4 && (
                <div className="space-y-3 mt-3.5">
                  <div className="p-4 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg">
                    <p className="text-[13px] text-[var(--ui-fg-muted)]">Review the member details before creating. Permissions can be updated later from the Roles & Permissions page.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button className="px-4 py-2 text-[var(--ui-fg-muted)] hover:text-[var(--ui-fg)] rounded-lg hover:bg-[var(--ui-surface-hover)] transition-colors" onClick={() => setWizardStep(Math.max(1, wizardStep - 1))} disabled={wizardStep === 1}>
                  Back
                </button>
                <button className="px-4 py-2 bg-[var(--ui-accent)] text-white rounded-lg hover:bg-[#059669] transition-colors" onClick={() => wizardStep < 4 ? setWizardStep(wizardStep + 1) : handleCreate()}>
                  {wizardStep < 4 ? 'Next' : 'Create Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
