'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/admin/toast-context'
import { formatDateFull } from '@/lib/date-utils'

const formatCurrency = (val: number) => '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const vipBadge: Record<string, string> = {
  platinum: 'admin-badge gold',
  gold: 'admin-badge gold',
  silver: 'admin-badge neutral',
  standard: 'admin-badge neutral',
}

const statusBadge: Record<string, string> = {
  active: 'admin-badge accent',
  inactive: 'admin-badge neutral',
}

const COUNTRY_FLAGS: Record<string, string> = {
  'Argentina': '🇦🇷', 'USA': '🇺🇸', 'United States': '🇺🇸', 'Spain': '🇪🇸', 'Mexico': '🇲🇽',
  'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'Colombia': '🇨🇴', 'France': '🇫🇷', 'Germany': '🇩🇪',
  'Brazil': '🇧🇷', 'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Italy': '🇮🇹', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
}

function getCountryFlag(country: string | null): string {
  if (!country) return '🌍'
  return COUNTRY_FLAGS[country] || '🌍'
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function getAvatarBg(vipLevel: string): string {
  const bgMap: Record<string, string> = {
    platinum: 'var(--ui-gold-soft)', gold: 'var(--ui-gold-soft)', silver: 'var(--ui-surface-hover)', standard: 'var(--ui-accent-soft)',
  }
  return bgMap[vipLevel] || bgMap.standard
}

function getAvatarColor(vipLevel: string): string {
  const colorMap: Record<string, string> = {
    platinum: 'var(--ui-gold)', gold: 'var(--ui-gold)', silver: 'var(--ui-fg-muted)', standard: 'var(--ui-accent)',
  }
  return colorMap[vipLevel] || colorMap.standard
}

export default function CustomersPage() {
  const { t } = useI18n()
  const d = (t.admin as any).customers ?? {}

  const [customers, setCustomers] = useState<any[]>([])
  const [kpi, setKpi] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vipFilter, setVipFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)
  const [formData, setFormData] = useState<Partial<any>>({})
  const { showToast } = useToast()

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (vipFilter !== 'all') params.set('vip_level', vipFilter)
      const res = await fetch(`/api/admin/customers?${params.toString()}`)
      const data = await res.json()
      setCustomers(data.customers || [])
      setKpi(data.kpi || {})
    } catch (err) {
      console.error('Failed to fetch customers', err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, vipFilter])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const openNew = () => {
    setEditingCustomer(null)
    setFormData({ name: '', email: '', phone: '', country: '', languages: '', status: 'active', vip_level: 'standard', notes: '', tags: '[]' })
    setShowForm(true)
  }

  const openEdit = (customer: any) => {
    setEditingCustomer(customer)
    setFormData({ ...customer })
    setShowForm(true)
  }

  const saveCustomer = async () => {
    try {
      if (editingCustomer) {
        const res = await fetch('/api/admin/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCustomer.id, ...formData }),
        })
        if (!res.ok) throw new Error('Failed to update')
        showToast(d.customerSaved || 'Cliente guardado')
      } else {
        const res = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to create')
        showToast(d.customerSaved || 'Cliente guardado')
      }
      setShowForm(false)
      fetchCustomers()
    } catch (err) {
      showToast('Error guardando cliente')
    }
  }

  const deactivateCustomer = async (customer: any) => {
    if (!confirm(d.confirmDelete || '¿Desactivar este cliente?')) return
    try {
      const res = await fetch(`/api/admin/customers?id=${customer.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showToast(d.customerDeleted || 'Cliente desactivado')
      if (selectedCustomer?.id === customer.id) setSelectedCustomer(null)
      fetchCustomers()
    } catch (err) {
      showToast('Error desactivando cliente')
    }
  }

  const exportCsv = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Country', 'Trips', 'LTV', 'Status', 'VIP Level', 'Last Trip', 'Member Since']
    const rows = customers.map((c) => [
      c.id, c.name, c.email, c.phone, c.country, c.total_trips, c.lifetime_value,
      c.status, c.vip_level, c.last_trip_date || '', c.created_at,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'customers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const vipLabel = (level: string): string => {
    const map: Record<string, string> = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', standard: 'Standard' }
    return map[level] || level
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">{d.title || 'Clientes'}</h1>
          <p className="admin-section-desc">{d.subtitle?.replace('{count}', String(kpi.total || customers.length)) || 'Gestiona los clientes de la plataforma.'}</p>
        </div>
        <div className="admin-flex-between" style={{ gap: 8 }}>
          <button onClick={exportCsv} className="admin-btn admin-btn-secondary admin-btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {d.export || 'Exportar'}
          </button>
          <button onClick={openNew} className="admin-btn admin-btn-primary admin-btn-sm">
            {d.add || '+ Agregar Cliente'}
          </button>
        </div>
      </section>
      <div className="admin-grid-6 admin-mb-4">
        {[
          { label: d.kpiTotalCustomers || 'Total Clientes', value: kpi.total ?? '—', icon: 'green' },
          { label: d.kpiActiveMonth || 'Activos este mes', value: kpi.active ?? '—', icon: 'blue' },
          { label: d.kpiVipCustomers || 'Clientes VIP', value: kpi.vip ?? '—', icon: 'gold' },
          { label: d.kpiReturningRate || 'Tasa de retorno', value: kpi.returning_rate ?? '—', icon: 'green' },
          { label: d.kpiAvgLtv || 'LTV Promedio', value: formatCurrency(kpi.avg_ltv ?? 0), icon: 'purple' },
          { label: d.kpiNpsScore || 'NPS Score', value: kpi.nps ?? '—', icon: 'gold' },
        ].map((card, i) => (
          <div key={i} className="admin-kpi-card">
            <div className="admin-kpi-label">{card.label}</div>
            <div className="admin-kpi-value">{card.value}</div>
            <div className="admin-kpi-sub neutral"></div>
          </div>
        ))}
      </div>
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">{d.title || 'Directorio de Clientes'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">{d.filterAll || 'Todos'}</option>
              <option value="active">{d.filterActive || 'Activos'}</option>
              <option value="inactive">{d.filterInactive || 'Inactivos'}</option>
            </select>
            <select
              value={vipFilter}
              onChange={e => setVipFilter(e.target.value)}
              className="admin-select"
            >
              <option value="all">{d.vipFilterAll || 'Todos los niveles VIP'}</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>País</th>
                  <th>Estado</th>
                  <th>Último Viaje</th>
                  <th>Viajes</th>
                  <th>LTV</th>
                  <th>Nivel VIP</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--ui-fg-muted)' }}>{d.loading || 'Cargando clientes...'}</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--ui-fg-muted)' }}>{d.noResults || 'No se encontraron clientes'}</td></tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} onClick={() => { setSelectedCustomer(customer) }} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="flex items-center gap-8">
                          <div className="admin-guest-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: getAvatarBg(customer.vip_level || 'standard'), color: getAvatarColor(customer.vip_level || 'standard'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>
                            {getInitials(customer.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ui-fg)' }}>{customer.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{getCountryFlag(customer.country)} {customer.country || '—'}</td>
                      <td>
                        <span className={`admin-badge ${customer.status === 'active' ? 'accent' : 'neutral'}`}>
                          {customer.status === 'active' ? d.statusActive || 'Activo' : d.statusInactive || 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>{customer.last_trip_date ? new Date(customer.last_trip_date).toLocaleDateString() : '—'}</td>
                      <td style={{ fontWeight: 600 }}>{customer.total_trips}</td>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--ui-font-mono)' }}>{formatCurrency(customer.lifetime_value)}</td>
                      <td>
                        <span className={`admin-badge ${vipBadge[customer.vip_level || 'standard']}`}>{vipLabel(customer.vip_level || 'standard')}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="admin-flex-between" style={{ justifyContent: 'center', gap: 6 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer) }}
                            className="admin-btn admin-btn-ghost admin-btn-sm" title="Ver"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-8 10-8 10 8 10 8-10 8-10-8"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(customer) }}
                            className="admin-btn admin-btn-ghost admin-btn-sm" title="Editar"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deactivateCustomer(customer) }}
                            className="admin-btn admin-btn-danger admin-btn-sm" title="Desactivar"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                          </button>
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

      {selectedCustomer && (
        <div className="admin-modal-overlay open" onClick={() => setSelectedCustomer(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{selectedCustomer.name}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSelectedCustomer(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-grid-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: getAvatarBg(selectedCustomer.vip_level || 'standard'), color: getAvatarColor(selectedCustomer.vip_level || 'standard'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 }}>
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ui-fg)' }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>
                      {getCountryFlag(selectedCustomer.country)} {selectedCustomer.country || '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      <span className={`admin-badge ${statusBadge[selectedCustomer.status]}`}>
                        {selectedCustomer.status === 'active' ? d.statusActive || 'Activo' : d.statusInactive || 'Inactivo'}
                      </span>
                      <span className={`admin-badge ${vipBadge[selectedCustomer.vip_level || 'standard']}`}>{vipLabel(selectedCustomer.vip_level || 'standard')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    [d.profileEmail || 'Email', selectedCustomer.email || '—'],
                    [d.profilePhone || 'Teléfono', selectedCustomer.phone || '—'],
                    [d.profileLanguages || 'Idiomas', selectedCustomer.languages || '—'],
                    [d.profileMemberSince || 'Desde', formatDateFull(selectedCustomer.created_at) || '—'],
                  ].map(([label, value], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--ui-border-light)' }}>
                      <span style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>{label}</span>
                      <span style={{ fontSize: 13, color: 'var(--ui-fg)', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ padding: 12, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Viajes</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--ui-font-mono)' }}>{selectedCustomer.total_trips}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>LTV</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--ui-font-mono)' }}>{formatCurrency(selectedCustomer.lifetime_value)}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Último viaje</div>
                  <div style={{ fontSize: 13, color: 'var(--ui-fg-muted)' }}>{selectedCustomer.last_trip_date ? new Date(selectedCustomer.last_trip_date).toLocaleDateString() : '—'}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(selectedCustomer)} className="admin-btn admin-btn-primary admin-btn-sm">{d.modalEdit || 'Editar Cliente'}</button>
                <button onClick={() => setSelectedCustomer(null)} className="admin-btn admin-btn-ghost admin-btn-sm">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay open" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingCustomer ? d.modalEdit || 'Editar Cliente' : d.modalAdd || 'Agregar Cliente'}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setShowForm(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <form onSubmit={(e) => { e.preventDefault(); saveCustomer() }}>
                <div className="admin-field">
                  <label className="admin-field-label">{d.formName || 'Nombre completo'}</label>
                  <input className="admin-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">{d.formEmail || 'Email'}</label>
                  <input className="admin-input" type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">{d.formPhone || 'Teléfono'}</label>
                  <input className="admin-input" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">{d.formCountry || 'País'}</label>
                  <input className="admin-input" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">{d.formLanguages || 'Idiomas'}</label>
                  <input className="admin-input" value={formData.languages || ''} onChange={e => setFormData({ ...formData, languages: e.target.value })} />
                </div>
                <div className="admin-grid-2">
                  <div className="admin-field">
                    <label className="admin-field-label">{d.formVipLevel || 'Nivel VIP'}</label>
                    <select className="admin-select" value={formData.vip_level || 'standard'} onChange={e => setFormData({ ...formData, vip_level: e.target.value })}>
                      <option value="standard">{d.vipNone || 'Standard'}</option>
                      <option value="silver">{d.vipSilver || 'Silver'}</option>
                      <option value="gold">{d.vipGold || 'Gold'}</option>
                      <option value="platinum">{d.vipPlatinum || 'Platinum'}</option>
                    </select>
                  </div>
                  <div className="admin-field">
                    <label className="admin-field-label">{d.formStatus || 'Estado'}</label>
                    <select className="admin-select" value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="active">{d.optionActive || 'Activo'}</option>
                      <option value="inactive">{d.optionInactive || 'Inactivo'}</option>
                    </select>
                  </div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">{d.formNotes || 'Notas'}</label>
                  <textarea className="admin-input" rows={3} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setShowForm(false)}>{d.cancel || 'Cancelar'}</button>
                  <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">{editingCustomer ? d.saveChanges || 'Guardar Cambios' : d.modalAdd || 'Agregar Cliente'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
