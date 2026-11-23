'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface Employee {
  id: number; name: string | null; email: string | null; phone: string | null
  employee_status: string | null; role_id: number | null; role_name: string | null
  rating: number | null; total_trips: number | null; created_at: string
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
  const { showToast } = useToast()

  const fetchEmployees = useCallback(async () => {
    try {
      const [empRes, roleRes] = await Promise.all([
        adminFetch('/api/admin/employees'),
        adminFetch('/api/admin/team'),
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
    const cs = ['var(--accent)', 'var(--info)', 'var(--gold)', 'var(--info)', 'var(--accent-hover)', 'var(--bg)']
    return `linear-gradient(135deg, ${cs[hash % cs.length]}, var(--bg))`
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
      const res = await adminFetch('/api/admin/employees', {
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
     return <div className="flex items-center justify-center h-64 text-[#646880]">{d.loading || 'Loading...'}</div>
   }

   return (
     <div className="emp-page">
       <section className="emp-hero">
         <div>
           <h1>{d.title || 'Employees'}</h1>
           <p>{d.subtitle || `Manage your team — ${stats.total} members`}</p>
         </div>
         <div className="emp-toolbar">
           <button className="btn btn-secondary btn-sm"
             onClick={() => showToast('Export queued')}>{d.export_ || 'Export'}</button>
           <button className="btn btn-primary btn-sm"
             onClick={openCreate}>{d.add || '+ Add Employee'}</button>
         </div>
       </section>

       <div className="emp-filters">
         {['all', 'active', 'inactive', 'on_route', 'verified', 'pending', 'needs_review'].map(f => (
           <button key={f}
             className={`chip ${filter === f ? 'active' : ''}`}
             onClick={() => setFilter(f)}>
             {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
           </button>
         ))}
       </div>

       <div className="emp-kpis">
         {[
           [d.kpis?.total || 'Total', String(stats.total)],
           [d.kpis?.active || 'Active', String(stats.active)],
           [d.kpis?.onRoute || 'On Route', String(stats.onRoute)],
           [d.kpis?.avgRating || 'Avg Rating', stats.avgRating],
           [d.kpis?.totalTrips || 'Total Trips', String(stats.totalTrips)],
           [d.kpis?.expiringDocs || 'Expiring Docs', String(stats.expiringDocs)],
         ].map(([label, value]) => (
           <div key={label} className="stat-card card-glass">
             <div className="stat-label">{label}</div>
             <div className="stat-value">{value}</div>
           </div>
         ))}
       </div>

       <div className="emp-layout">
         {/* ── Left: Table ── */}
         <section className="panel">
           <div className="panel-header">
             <div className="panel-title">{d.tableTitle || 'Employee Directory'} <span className="count">{filtered.length} visible</span></div>
             <div className="emp-toolbar">
               <button className="btn btn-secondary btn-sm" onClick={() => showToast('Filters opened')}>Filter</button>
               <button className="btn btn-secondary btn-sm" onClick={() => showToast('Export CSV')}>{d.export_ || 'Export'}</button>
             </div>
           </div>
           <div className="table-wrap">
             <table className="emp-table">
               <thead>
                 <tr>
                   <th>{d.tableName || 'Employee'}</th>
                   <th>{d.tableRole || 'Role'}</th>
                   <th>{d.tableStatus || 'Status'}</th>
                   <th>{d.tableTrips || 'Trips'}</th>
                   <th>{d.tableRating || 'Rating'}</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {filtered.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="text-fg-muted text-center py-8">{d.noResults || 'No employees found'}</td>
                   </tr>
                 ) : filtered.map(emp => (
                   <tr key={emp.id} className="emp-row" onClick={() => setSelectedId(emp.id)}>
                     <td>
                       <div className="emp-person">
                         <div className="emp-avatar" style={{ background: getAvatarColor(emp.name) }}>
                           {getInit(emp.name)}
                         </div>
                         <div>
                           <div className="emp-name">{emp.name}</div>
                           <div className="emp-meta">{emp.email}</div>
                         </div>
                       </div>
                     </td>
                     <td>
                       <span className={`badge-role ${getRoleBadge(emp.role_name)}`}>
                         {emp.role_name || '—'}
                       </span>
                     </td>
                     <td>
                       <span className={`badge-status ${emp.employee_status === 'active' ? 'active' : emp.employee_status === 'inactive' ? 'inactive' : emp.employee_status === 'suspended' ? 'suspended' : 'leave'}`}>
                         {emp.employee_status === 'leave' ? 'On Leave' : (emp.employee_status || '—')}
                       </span>
                     </td>
                     <td>{emp.total_trips || 0}</td>
                     <td>{emp.rating ? `★ ${emp.rating}` : '—'}</td>
                     <td>
                       <div className="inline-actions">
                         <button className="mini-btn" onClick={() => showToast('Audit log opened')}>Log</button>
                         <button className="mini-btn" onClick={e => { e.stopPropagation(); openEdit(emp) }}>{d.edit || 'Edit'}</button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </section>

         {/* ── Right: Side Panel ── */}
         <aside className="side-stack">
           <section className="side-card">
             <div className="panel-header">
               <div className="panel-title">{d.sidePanel?.profile || 'Selected Profile'} <span className="count">{selected?.role_name || '—'}</span></div>
               {selected && (
                 <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selected)}>Edit</button>
               )}
             </div>
             <div className="content">
               {!selected ? (
                 <p style={{ color: 'var(--fg-muted)', textAlign: 'center', padding: '32px 0' }}>{d.selectPrompt || 'Select an employee to view profile'}</p>
               ) : (
                 <>
                   <div className="profile-top">
                     <div className="profile-photo" style={{ background: getAvatarColor(selected.name) }}>
                       {getInit(selected.name)}
                     </div>
                     <div>
                       <h2>{selected.name}</h2>
                       <div className="sub">{selected.role_name || '—'}</div>
                       <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                         <span className={`badge-role ${getRoleBadge(selected.role_name)}`}>{selected.role_name || '—'}</span>
                         <span className={`badge-status ${selected.employee_status === 'active' ? 'active' : selected.employee_status === 'inactive' ? 'inactive' : selected.employee_status === 'suspended' ? 'suspended' : 'leave'}`}>
                           {selected.employee_status === 'leave' ? 'On Leave' : (selected.employee_status || '—')}
                         </span>
                       </div>
                     </div>
                   </div>
                   <div className="info-grid" style={{ marginTop: 16 }}>
                     <div className="info-item"><label>{d.formEmail || 'Email'}</label><div>{selected.email || '—'}</div></div>
                     <div className="info-item"><label>{d.formPhone || 'Phone'}</label><div>{selected.phone || '—'}</div></div>
                     <div className="info-item"><label>{d.formRole || 'Role'}</label><div>{selected.role_name || '—'}</div></div>
                     <div className="info-item"><label>Trips</label><div>{selected.total_trips || 0}</div></div>
                     <div className="info-item"><label>Rating</label><div>{selected.rating ? `★ ${selected.rating}` : '—'}</div></div>
                     <div className="info-item"><label>Joined</label><div>{selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'}</div></div>
                   </div>
                   <div className="audit" id="selNote">Employee record active since {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'}</div>
                 </>
               )}
             </div>
           </section>

           <section className="side-card">
             <div className="panel-header">
               <div className="panel-title">{d.sidePanel?.recentActivity || 'Recent Activity'}</div>
             </div>
             <div className="content activity-list">
               {!selected ? (
                 <p style={{ color: 'var(--fg-muted)', padding: '12px 0', fontSize: 13 }}>{d.noSelection || 'No employee selected'}</p>
               ) : (
                 [
                   { dot: theme.accent, text: 'Profile updated', time: '2h ago' },
                   { dot: theme.info, text: 'Trip #128 completed', time: '5h ago' },
                   { dot: theme.warning, text: 'Documents verified', time: '1d ago' },
                 ].map((act, i) => (
                   <div key={i} className="activity-item">
                     <div className="activity-dot" style={{ background: act.dot }} />
                     <div>{act.text}</div>
                     <div className="activity-time">{act.time}</div>
                   </div>
                 ))
               )}
             </div>
           </section>
         </aside>
       </div>

      {/* ── Create/Edit Modal ── */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
          <div className="modal max-w-[600px]">
            <div className="modal-header">
              <div>
                <h2>{editEmp ? (d.modalEdit || 'Edit Employee') : (d.modalAdd || 'Add Employee')}</h2>
                <p>{d.modalDesc || 'Employee registration and role assignment.'}</p>
              </div>
              <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div className="modal-body grid grid-cols-2 gap-3">
              <div className="form-group">
                <label>{d.formName || 'Full name'}</label>
                <input placeholder="e.g. John Doe"
                  value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>{d.formEmail || 'Email'}</label>
                <input placeholder="email@company.com"
                  value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>{d.formPhone || 'Phone'}</label>
                <input placeholder="+57 300 000 0000"
                  value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>{d.formRole || 'Role'}</label>
                <select value={form.role_id || ''} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}>
                  <option value="">{d.selectRole || 'Select role...'}</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{d.formStatus || 'Status'}</label>
                <select value={form.employee_status || 'active'} onChange={e => setForm(p => ({ ...p, employee_status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>{d.cancel || 'Cancel'}</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editEmp ? (d.saveChanges || 'Update') : (d.modalAdd || 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
