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

const statusLabels: Record<string, string> = {
  active: 'Activo', inactive: 'Inactivo', on_route: 'En Ruta', suspended: 'Suspendido', leave: 'Ausente', pending: 'Pendiente', needs_review: 'Revisar'
}

const statusBadge: Record<string, string> = {
  active: 'admin-badge accent',
  inactive: 'admin-badge neutral',
  on_route: 'admin-badge info',
  suspended: 'admin-badge danger',
  leave: 'admin-badge warning',
  pending: 'admin-badge warning',
  needs_review: 'admin-badge warning',
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
    return e.employee_status === filter
  }), [employees, search, filter])

  const getInit = (name: string | null) =>
    name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'

  const getAvatarColor = (name: string | null) => {
    const hash = (name || '').charCodeAt(0) || 0
    const cs = ['var(--ui-accent)', 'var(--ui-info)', 'var(--ui-gold)', 'var(--ui-info)', 'var(--ui-accent)', 'var(--ui-bg)']
    return `linear-gradient(135deg, ${cs[hash % cs.length]}, var(--ui-bg))`
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
        showToast(editEmp ? 'Empleado actualizado' : 'Empleado creado')
        setModalOpen(false)
        fetchEmployees()
      } else {
        showToast('Error guardando empleado')
      }
    } catch { showToast('Error guardando empleado') }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty" style={{ padding: '48px 24px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/></svg>
          <h3>{d.loading || 'Cargando...'}</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">{d.title || 'Empleados'}</h1>
          <p className="admin-section-desc">{d.subtitle || `Gestiona tu equipo — ${stats.total} miembros`}</p>
        </div>
        <div className="admin-flex-between" style={{ gap: 8 }}>
          <button onClick={() => showToast('Exportación encolada')} className="admin-btn admin-btn-secondary admin-btn-sm">{d.export_ || 'Exportar'}</button>
          <button onClick={openCreate} className="admin-btn admin-btn-primary admin-btn-sm">{d.add || '+ Agregar Empleado'}</button>
        </div>
      </section>
      <div className="admin-grid-6 admin-mt-4">
        {[
          [d.kpis?.total || 'Total', String(stats.total)],
          [d.kpis?.active || 'Activos', String(stats.active)],
          [d.kpis?.onRoute || 'En Ruta', String(stats.onRoute)],
          [d.kpis?.avgRating || 'Calif. Prom.', stats.avgRating],
          [d.kpis?.totalTrips || 'Viajes Totales', String(stats.totalTrips)],
          [d.kpis?.expiringDocs || 'Docs Venciendo', String(stats.expiringDocs)],
        ].map(([label, value], idx) => (
          <div key={idx} className="admin-kpi-card">
            <div className="admin-kpi-label">{label}</div>
            <div className="admin-kpi-value">{value}</div>
            <div className="admin-kpi-sub neutral"></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', 'active', 'inactive', 'on_route', 'verified', 'pending', 'needs_review'].map(f => (
          <button key={f} className={`admin-tab ${filter === f ? 'active' : ''}`} style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Layout */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">{d.tableTitle || 'Directorio de Empleados'}</span>
          <span className="admin-badge neutral">{filtered.length} visibles</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Viajes</th>
                  <th>Calificación</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--ui-fg-muted)' }}>{d.noResults || 'No hay empleados'}</td></tr>
                ) : (
                  filtered.map(emp => (
                    <tr key={emp.id} onClick={() => setSelectedId(emp.id)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="flex items-center gap-8">
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: getAvatarColor(emp.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>
                            {getInit(emp.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ui-fg)' }}>{emp.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge neutral">{emp.role_name || '—'}</span>
                      </td>
                      <td>
                        <span className={`admin-badge ${statusBadge[emp.employee_status || 'pending'] || 'admin-badge neutral'}`}>
                          {statusLabels[emp.employee_status || '—'] || emp.employee_status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{emp.total_trips || 0}</td>
                      <td>{emp.rating ? `★ ${emp.rating}` : '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="admin-flex-between" style={{ justifyContent: 'center', gap: 6 }}>
                          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={(e) => { e.stopPropagation(); showToast('Registro de auditoría abierto') }} title="Registro">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12H2l2 3-7-3z"/><path d="M18 13l3 3 4-4V3l-3-3-4 4z"/></svg>
                          </button>
                          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(emp) }} title="Editar">{d.edit || 'Editar'}</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Side panel (profile) below table */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">{d.sidePanel?.profile || 'Perfil Seleccionado'}</span>
          <span className="admin-badge neutral">{selected?.role_name || '—'}</span>
        </div>
        <div className="admin-card-body">
          {!selected ? (
            <div className="admin-empty" style={{ padding: '24px 24px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>{d.selectPrompt || 'Selecciona un empleado para ver el perfil'}</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: getAvatarColor(selected.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 16 }}>
                    {getInit(selected.name)}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ui-fg)' }}>{selected.name}</h2>
                    <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>{selected.role_name || '—'}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <span className="admin-badge neutral">{selected.role_name || '—'}</span>
                      <span className={`admin-badge ${statusBadge[selected.employee_status || 'pending'] || 'admin-badge neutral'}`}>
                        {selected.employee_status === 'leave' ? 'Ausente' : (selected.employee_status || '—')}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: 10, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Email</div>
                    <div style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{selected.email || '—'}</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Teléfono</div>
                    <div style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{selected.phone || '—'}</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Viajes</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)' }}>{selected.total_trips || 0}</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Calificación</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)' }}>{selected.rating ? `★ ${selected.rating}` : '—'}</div>
                  </div>
                  <div style={{ padding: 10, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Ingreso</div>
                    <div style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => openEdit(selected)} className="admin-btn admin-btn-primary admin-btn-sm">Editar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editEmp ? d.modalEdit || 'Editar Empleado' : d.modalAdd || 'Agregar Empleado'}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label className="admin-field-label">{d.formName || 'Nombre completo'}</label>
                    <input className="admin-input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Juan Pérez" />
                  </div>
                  <div className="admin-field">
                    <label className="admin-field-label">{d.formEmail || 'Email'}</label>
                    <input className="admin-input" type="email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">{d.formPhone || 'Teléfono'}</label>
                  <input className="admin-input" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label className="admin-field-label">{d.formRole || 'Rol'}</label>
                    <select className="admin-select" value={form.role_id || ''} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}>
                      <option value="">{d.selectRole || 'Seleccionar rol...'}</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label className="admin-field-label">{d.formStatus || 'Estado'}</label>
                    <select className="admin-select" value={form.employee_status || 'active'} onChange={e => setForm(p => ({ ...p, employee_status: e.target.value }))}>
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="suspended">Suspendido</option>
                      <option value="leave">Ausente</option>
                    </select>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setModalOpen(false)}>{d.cancel || 'Cancelar'}</button>
                  <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">{editEmp ? d.saveChanges || 'Actualizar' : d.modalAdd || 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
