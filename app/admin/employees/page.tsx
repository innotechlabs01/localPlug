'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'

interface Employee {
  id: number; name: string | null; email: string | null; phone: string | null
  employee_status: string | null; role_id: number | null; role_name: string | null
  rating: number | null; total_trips: number | null; created_at: string
}

interface Role {
  id: number; name: string; description: string
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

export default function EmployeesPage() {
  const { t } = useI18n()
  const d = t.admin.employees || t.admin.team

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmp, setEditEmp] = useState<Employee | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [notif, setNotif] = useState<{ id: number; msg: string }[]>([])

  const showToast = (msg: string) => {
    const id = Date.now()
    setNotif(p => [...p, { id, msg }])
    setTimeout(() => setNotif(p => p.filter(n => n.id !== id)), 3000)
  }

  const fetchEmployees = useCallback(async () => {
    try {
      const [empRes, roleRes] = await Promise.all([
        fetch('/api/admin/employees'),
        fetch('/api/admin/team'),
      ])
      if (empRes.ok) {
        const data = await empRes.json()
        setEmployees(data.employees || [])
      }
      if (roleRes.ok) {
        const data = await roleRes.json()
        setRoles(data.roles || data || [])
      }
    } catch (err) {
      console.error('Failed to fetch employees', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const selected = useMemo(() => employees.find(e => e.id === selectedId), [employees, selectedId])

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.employee_status === 'active').length,
    onRoute: employees.filter(e => e.employee_status === 'on_route').length,
    avgRating: employees.length ? (employees.reduce((s, e) => s + (e.rating || 0), 0) / employees.filter(e => e.rating).length).toFixed(1) : '0',
    totalTrips: employees.reduce((s, e) => s + (e.total_trips || 0), 0),
    expiringDocs: 0,
  }), [employees])

  const filtered = useMemo(() => employees.filter(e => {
    const q = search.toLowerCase()
    if (search && !(e.name || '').toLowerCase().includes(q) && !(e.email || '').toLowerCase().includes(q)) return false
    if (filter === 'all') return true
    if (filter === 'verified') return true
    if (filter === 'pending') return true
    if (filter === 'needs_review') return true
    return e.employee_status === filter
  }), [employees, search, filter])

  const getInit = (name: string | null) =>
    name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'

  const getAvatarColor = (name: string | null) => {
    const hash = (name || '').charCodeAt(0) || 0
    const cs = ['#10b981', '#3b82f6', '#d4a84b', '#6366f1', '#059669', '#0f172a']
    return `linear-gradient(135deg, ${cs[hash % cs.length]}, #0f172a)`
  }

  const getRoleBadge = (role: string | null) => {
    const cls = role === 'admin' ? 'admin' : role === 'ops' ? 'ops' : role === 'support' ? 'support' : ''
    return cls
  }

  const openCreate = () => { setEditEmp(null); setForm({}); setModalOpen(true) }

  const openEdit = (e: Employee) => {
    setEditEmp(e)
    setForm({
      name: e.name || '',
      email: e.email || '',
      phone: e.phone || '',
      role_id: String(e.role_id || ''),
      employee_status: e.employee_status || 'active',
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const body = { ...form }
      if (editEmp) body.id = String(editEmp.id)
      const res = await fetch('/api/admin/employees', {
        method: editEmp ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast(editEmp ? 'Employee updated' : 'Employee created')
        setModalOpen(false)
        fetchEmployees()
      } else {
        showToast('Failed to save employee')
      }
    } catch { showToast('Error saving employee') }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#646880]">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[#f0f2f5] tracking-tight">{d.title || 'Employees'}</h1>
          <p className="text-[13px] text-[#646880] mt-1.5 max-w-[760px] leading-relaxed">
            {d.subtitle || `Manage your team — ${stats.total} members`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border border-[#282b38] text-[12px] text-[#9ca0b0] rounded-lg hover:bg-[#202330] transition-all font-medium"
            onClick={() => showToast('Export queued')}>Export</button>
          <button className="px-4 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all"
            onClick={openCreate}>{d.add || '+ Add'}</button>
        </div>
      </div>

      {/* ── Filter Chips ── */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'inactive', 'on_route', 'verified', 'pending', 'needs_review'].map(f => (
          <button key={f}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${
              filter === f
                ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[#10b981]'
                : 'bg-[#181b25] text-[#646880] border-[#282b38] hover:border-[#10b981] hover:text-[#f0f2f5]'
            }`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['Total', String(stats.total), 'Team members'],
          ['Active', String(stats.active), 'Currently working'],
          ['On Route', String(stats.onRoute), 'In service'],
          ['Avg Rating', stats.avgRating, 'Performance'],
          ['Total Trips', String(stats.totalTrips), 'All time'],
          ['Expiring Docs', String(stats.expiringDocs), 'Needs review'],
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
              <span className="text-[14px] font-bold text-[#f0f2f5]">Employees</span>
              <span className="text-[12px] text-[#646880] font-medium">{filtered.length} shown</span>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#646880]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="w-[200px] pl-9 pr-3 py-1.5 bg-[#0b0d14] border border-[#282b38] rounded-lg text-[12px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all"
                placeholder="Search employees..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.02)]">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Employee</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Role</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Trips</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5">Rating</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#646880] px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-[#646880] text-[13px]">No employees found</td></tr>
                ) : filtered.map(emp => (
                  <tr key={emp.id}
                    className="border-b border-[#1e2130] hover:bg-[#0b0d14] cursor-pointer transition-colors"
                    onClick={() => setSelectedId(emp.id)}
                    style={{ background: selectedId === emp.id ? theme.surfaceHover : '' }}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0"
                          style={{ background: getAvatarColor(emp.name) }}>
                          {getInit(emp.name)}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[#f0f2f5]">{emp.name}</div>
                          <div className="text-[12px] text-[#646880]">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        getRoleBadge(emp.role_name)
                          ? `bg-[${theme.accentSoft}] text-[${theme.accent}] border-[${theme.accent}]`
                          : 'bg-[#0b0d14] text-[#9ca0b0] border-[#282b38]'
                      }`}
                        style={getRoleBadge(emp.role_name) ? {
                          background: emp.role_name === 'admin' ? theme.accentSoft : emp.role_name === 'ops' ? theme.infoSoft : theme.warningSoft,
                          color: emp.role_name === 'admin' ? theme.accent : emp.role_name === 'ops' ? theme.info : theme.warning,
                          borderColor: emp.role_name === 'admin' ? theme.accent : emp.role_name === 'ops' ? theme.info : theme.warning,
                        } : {}}>
                        {emp.role_name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        emp.employee_status === 'active'
                          ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                          : emp.employee_status === 'inactive'
                            ? 'bg-[rgba(100,104,128,0.15)] text-[#646880]'
                            : emp.employee_status === 'suspended'
                              ? 'bg-[rgba(239,68,80,0.12)] text-[#ef4450]'
                              : 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]'
                      }`}>
                        {emp.employee_status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#9ca0b0]">{emp.total_trips || 0}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[#9ca0b0]">{emp.rating ? `★ ${emp.rating}` : '—'}</td>
                    <td className="px-4 py-3.5">
                      <button className="border border-[#282b38] bg-[#181b25] text-[#f0f2f5] rounded-lg px-2.5 py-1.5 text-[12px] cursor-pointer hover:border-[#10b981] hover:text-[#10b981] transition-all"
                        onClick={e => { e.stopPropagation(); openEdit(emp) }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Side Panel ── */}
        <div className="space-y-4 sticky top-20">
          {/* Profile */}
          <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
              <span className="text-[14px] font-bold text-[#f0f2f5]">Employee Profile</span>
              {selected && (
                <button className="px-2 py-1 text-[11px] text-[#9ca0b0] border border-[#282b38] rounded-lg hover:bg-[#202330] transition-all"
                  onClick={() => openEdit(selected)}>Edit</button>
              )}
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-8">Select an employee to view profile</p>
              ) : (
                <>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center text-white font-bold text-[20px] flex-shrink-0"
                      style={{ background: getAvatarColor(selected.name) }}>
                      {getInit(selected.name)}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-[#f0f2f5]">{selected.name}</h2>
                      <p className="text-[12px] text-[#646880]">{selected.role_name || '—'}</p>
                      <span className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        selected.employee_status === 'active'
                          ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                          : 'bg-[rgba(100,104,128,0.15)] text-[#646880]'
                      }`}>{selected.employee_status || '—'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Email', selected.email || '—'],
                      ['Phone', selected.phone || '—'],
                      ['Role', selected.role_name || '—'],
                      ['Trips', String(selected.total_trips || 0)],
                      ['Rating', selected.rating ? `★ ${selected.rating}` : '—'],
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

          {/* Recent Activity */}
          <div className="bg-[#181b25] border border-[#282b38] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
              <span className="text-[14px] font-bold text-[#f0f2f5]">Recent Activity</span>
            </div>
            <div className="p-4">
              {!selected ? (
                <p className="text-[13px] text-[#646880] text-center py-4">No employee selected</p>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { dot: theme.accent, text: 'Profile updated', time: '2h ago' },
                    { dot: theme.info, text: 'Trip #128 completed', time: '5h ago' },
                    { dot: theme.warning, text: 'Documents verified', time: '1d ago' },
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

      {/* ── Create/Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/62" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-auto bg-[#0b0d14] border border-[#282b38] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#282b38]">
              <div>
                <h2 className="text-[18px] font-bold text-[#f0f2f5]">{editEmp ? 'Edit Employee' : 'Add Employee'}</h2>
                <p className="text-[12px] text-[#646880] mt-1">Employee registration and role assignment.</p>
              </div>
              <button className="text-[#646880] hover:text-[#f0f2f5] text-2xl" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">Full name</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder="e.g. John Doe"
                  value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">Email</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder="email@company.com"
                  value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">Phone</label>
                <input className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none" placeholder="+57 300 000 0000"
                  value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">Role</label>
                <select className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none"
                  value={form.role_id || ''} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}>
                  <option value="">Select role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#646880]">Status</label>
                <select className="w-full px-3 py-2 bg-[#181b25] border border-[#282b38] rounded-lg text-[13px] text-[#f0f2f5] outline-none"
                  value={form.employee_status || 'active'} onChange={e => setForm(p => ({ ...p, employee_status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-[#282b38]">
              <button className="px-4 py-2 border border-[#282b38] text-[13px] text-[#9ca0b0] rounded-lg hover:bg-[#202330] transition-all" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="px-4 py-2 bg-[#10b981] text-white text-[13px] font-medium rounded-lg hover:bg-[#059669] transition-all" onClick={handleSubmit}>
                {editEmp ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toasts ── */}
      <div className="fixed bottom-6 right-6 space-y-2 z-[800]">
        {notif.map(n => (
          <div key={n.id} className="bg-[#181b25] border border-[#282b38] text-[#f0f2f5] px-4 py-3 rounded-xl shadow-2xl text-[13px] animate-slide-up">
            {n.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 300ms ease; }
      `}</style>
    </div>
  )
}
