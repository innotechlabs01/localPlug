'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/admin/toast-context'
import { formatDateFull } from '@/lib/date-utils'
import type { Customer } from '@/app/api/admin/customers/route'

type TabKey = 'profile' | 'reservations' | 'preferences' | 'support' | 'tags'

const VIP_BADGES: Record<string, string> = {
  platinum: 'bg-[rgba(168,85,247,0.15)] text-[#a855f7]',
  gold: 'bg-[rgba(234,179,8,0.15)] text-[#eab308]',
  silver: 'bg-[rgba(148,163,184,0.15)] text-[#94a3b8]',
  standard: 'bg-[rgba(100,116,139,0.1)] text-[#64748b]',
}

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-[rgba(16,185,129,0.12)] text-[#10b981]',
  inactive: 'bg-[rgba(100,104,128,0.12)] text-[#646880]',
}

function formatCurrency(val: number): string {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string | null | undefined): string {
  return formatDateFull(dateStr)
}

function vipLabel(d: any, level: string): string {
  const key = `vip${level.charAt(0).toUpperCase()}${level.slice(1)}` as keyof typeof d
  return (d[key] as string) || level
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function getAvatarBg(vipLevel: string): string {
  const bgMap: Record<string, string> = {
    platinum: 'var(--gold-soft)',
    gold: 'var(--gold-soft)',
    silver: 'rgba(148,163,184,0.15)',
    standard: 'var(--accent-soft)',
  }
  return bgMap[vipLevel] || bgMap.standard
}

function getAvatarColor(vipLevel: string): string {
  const colorMap: Record<string, string> = {
    platinum: 'var(--gold)',
    gold: 'var(--gold)',
    silver: 'var(--fg-muted)',
    standard: 'var(--accent)',
  }
  return colorMap[vipLevel] || colorMap.standard
}

const COUNTRY_FLAGS: Record<string, string> = {
  'Argentina': '🇦🇷', 'USA': '🇺🇸', 'United States': '🇺🇸',
  'Spain': '🇪🇸', 'Mexico': '🇲🇽', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧',
  'France': '🇫🇷', 'Colombia': '🇨🇴', 'Japan': '🇯🇵', 'Germany': '🇩🇪',
  'Brazil': '🇧🇷', 'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Italy': '🇮🇹',
  'Canada': '🇨🇦', 'Australia': '🇦🇺',
}

function getCountryFlag(country: string | null): string {
  if (!country) return '🌍'
  return COUNTRY_FLAGS[country] || '🌍'
}

function getRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`
}

export default function CustomersPage() {
  const { t } = useI18n()
  const d = (t.admin as any).customers

  const [customers, setCustomers] = useState<Customer[]>([])
  const [kpi, setKpi] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vipFilter, setVipFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [detailTab, setDetailTab] = useState<TabKey>('profile')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<Customer>>({})
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

  const openEdit = (customer: Customer) => {
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
        showToast(d.customerSaved as string)
      } else {
        const res = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to create')
        showToast(d.customerSaved as string)
      }
      setShowForm(false)
      fetchCustomers()
    } catch (err) {
      showToast('Error saving customer')
    }
  }

  const deactivateCustomer = async (customer: Customer) => {
    if (!confirm(d.confirmDelete as string)) return
    try {
      const res = await fetch(`/api/admin/customers?id=${customer.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showToast(d.customerDeleted as string)
      if (selectedCustomer?.id === customer.id) setSelectedCustomer(null)
      fetchCustomers()
    } catch (err) {
      showToast('Error deactivating customer')
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

  const filtered = customers

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="customers-page">
        {/* KPI Row */}
        <div className="customer-kpi-row">
          {[
            { label: d.kpiTotalCustomers || 'Total Customers', value: kpi.total ?? '—', color: 'green' },
            { label: d.kpiActiveMonth || 'Active This Month', value: kpi.active ?? '—', color: 'blue' },
            { label: d.kpiVipCustomers || 'VIP Customers', value: kpi.vip ?? '—', color: 'gold' },
            { label: d.kpiReturningRate || 'Returning Rate', value: kpi.returning_rate ?? '—', color: 'green' },
            { label: d.kpiAvgLtv || 'Avg. LTV', value: formatCurrency(kpi.avg_ltv ?? 0), color: 'purple' },
            { label: d.kpiNpsScore || 'NPS Score', value: kpi.nps ?? '—', color: 'gold' },
          ].map((card, i) => (
            <div key={i} className="customer-kpi">
              <div className={`kpi-val ${card.color}`}>{card.value}</div>
              <div className="kpi-label">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar-row">
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)', outline: 'none' }}
            >
              <option value="all">{d.filterAll as string}</option>
              <option value="active">{d.filterActive as string}</option>
              <option value="inactive">{d.filterInactive as string}</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={vipFilter}
              onChange={(e) => setVipFilter(e.target.value)}
              className="input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)', outline: 'none' }}
            >
              <option value="all">{d.vipFilterAll || 'All VIP Levels'}</option>
              <option value="platinum">{d.vipPlatinum as string}</option>
              <option value="gold">{d.vipGold as string}</option>
              <option value="silver">{d.vipSilver as string}</option>
              <option value="standard">{d.vipNone as string}</option>
            </select>
          </div>
          <button onClick={exportCsv} className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {d.export as string}
          </button>
          <button onClick={openNew} className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
            {d.add as string}
          </button>
        </div>

        {/* Customer Table */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header" style={{ padding: '12px 16px' }}>
            <span className="card-title" style={{ fontSize: 13 }}>{d.title as string}</span>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{(d.subtitle as string).replace('{count}', String(kpi.total || customers.length))}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Last Trip</th>
                  <th>Trips</th>
                  <th>LTV</th>
                  <th>VIP Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">{d.loading as string}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">{d.noResults as string}</td>
                  </tr>
                ) : (
                  filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="customer-row"
                      data-status={customer.status}
                      data-vip={customer.vip_level}
                      onClick={() => { setSelectedCustomer(customer); setDetailTab('profile') }}
                    >
                      <td>
                        <div className="table-customer-name">
                          <div
                            className="table-customer-avatar"
                            style={{
                              background: getAvatarBg(customer.vip_level),
                              color: getAvatarColor(customer.vip_level)
                            }}
                          >
                            {getInitials(customer.name)}
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div style={{ color: 'var(--fg-muted)', fontSize: 12 }}>{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="country-flag">{getCountryFlag(customer.country)}</span> {customer.country || '—'}
                      </td>
                      <td>
                        <span className={`badge ${customer.status === 'active' ? 'badge-accent' : 'badge-warning'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                          {customer.status === 'active' ? d.statusActive as string : d.statusInactive as string}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{getRelativeTime(customer.last_trip_date)}</td>
                      <td style={{ fontWeight: 600 }}>{customer.total_trips}</td>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{formatCurrency(customer.lifetime_value)}</td>
                      <td>
                        <span className={`vip-badge ${customer.vip_level || 'standard'}`}>
                          {vipLabel(d, customer.vip_level)}
                        </span>
                      </td>
                      <td>
                        <div className="actions-group">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setDetailTab('profile') }}
                            className="action-btn"
                            title="View"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(customer) }}
                            className="action-btn"
                            title="Edit"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deactivateCustomer(customer) }}
                            className="action-btn danger"
                            title="Delete"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
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
      </div>

      {/* Panel Overlay */}
      <div
        className={`panel-overlay ${selectedCustomer ? 'open' : ''}`}
        onClick={() => setSelectedCustomer(null)}
      />

      {/* Slide-in Detail Panel */}
      {selectedCustomer && (
        <div className={`detail-panel open`}>
          <div className="panel-header">
            <span className="panel-header-title">{selectedCustomer.name}</span>
            <button className="panel-close" onClick={() => setSelectedCustomer(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="panel-body">
            {/* Profile Summary */}
            <div className="profile-summary">
              <div
                className="profile-avatar-large"
                style={{
                  background: getAvatarBg(selectedCustomer.vip_level),
                  color: getAvatarColor(selectedCustomer.vip_level)
                }}
              >
                {getInitials(selectedCustomer.name)}
              </div>
              <div className="profile-info">
                <div className="profile-name">
                  {selectedCustomer.name}{' '}
                  <span className={`vip-badge ${selectedCustomer.vip_level || 'standard'}`}>
                    {vipLabel(d, selectedCustomer.vip_level)}
                  </span>
                </div>
                <div className="profile-meta">
                  <span>{getCountryFlag(selectedCustomer.country)} {selectedCustomer.country || '—'}</span>
                  <span>&middot;</span>
                  <span>{selectedCustomer.phone || '—'}</span>
                </div>
                <div className="profile-meta">
                  <span>{selectedCustomer.email}</span>
                  <span>&middot;</span>
                  <span>{selectedCustomer.languages || '—'}</span>
                </div>
                <div className="profile-stats">
                  <div className="profile-stat">
                    <div className="profile-stat-num">{selectedCustomer.total_trips}</div>
                    <div className="profile-stat-label">Trips</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-num" style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(selectedCustomer.lifetime_value)}</div>
                    <div className="profile-stat-label">LTV</div>
                  </div>
                  <div className="profile-stat">
                    <div className="profile-stat-num">{formatDate(selectedCustomer.created_at) || '—'}</div>
                    <div className="profile-stat-label">Since</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="tabs" style={{ marginBottom: 0 }}>
              {(['profile', 'reservations', 'preferences', 'support', 'tags'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`tab ${detailTab === tab ? 'active' : ''}`}
                >
                  {d[`detail${tab.charAt(0).toUpperCase()}${tab.slice(1)}` as keyof typeof d] as string || tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {detailTab === 'profile' && (
              <div>
                <div className="panel-section-title">{d.profileName as string || 'Profile'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{d.profilePhone as string || 'Phone'}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg)' }}>{selectedCustomer.phone || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{d.profileCountry as string || 'Country'}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg)' }}>{selectedCustomer.country || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{d.profileLanguages as string || 'Languages'}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg)' }}>{selectedCustomer.languages || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{d.profileVipLevel as string || 'VIP Level'}</div>
                      <span className={`vip-badge ${selectedCustomer.vip_level || 'standard'}`}>
                        {vipLabel(d, selectedCustomer.vip_level)}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{d.profileStatus as string || 'Status'}</div>
                      <span className={`badge ${selectedCustomer.status === 'active' ? 'badge-accent' : 'badge-warning'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                        {selectedCustomer.status === 'active' ? d.statusActive as string : d.statusInactive as string}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{d.profileMemberSince as string || 'Member Since'}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg)' }}>{formatDate(selectedCustomer.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => openEdit(selectedCustomer)} className="btn btn-primary w-full">
                      {d.modalEdit as string}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'reservations' && (
              <div className="py-8 text-center" style={{ color: 'var(--fg-muted)' }}>
                {d.noReservations as string}
              </div>
            )}

            {detailTab === 'preferences' && (
              <div className="py-8 text-center" style={{ color: 'var(--fg-muted)' }}>
                {d.noPreferences as string}
              </div>
            )}

            {detailTab === 'support' && (
              <div className="py-8 text-center" style={{ color: 'var(--fg-muted)' }}>
                {d.noSupport as string}
              </div>
            )}

            {detailTab === 'tags' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div className="panel-section-title">{d.tagsTitle as string || 'Tags'}</div>
                  {(() => {
                    let tags: string[] = []
                    try { tags = JSON.parse(selectedCustomer.tags || '[]') } catch {}
                    return tags.length > 0 ? (
                      <div className="tags-wrap">
                        {tags.map((tag, i) => (
                          <span key={i} className="tag-item active">{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{d.noTags as string}</p>
                    )
                  })()}
                </div>
                <div>
                  <div className="panel-section-title">{d.notesTitle as string || 'Notes'}</div>
                  <p style={{ fontSize: 13, color: selectedCustomer.notes ? 'var(--fg-secondary)' : 'var(--fg-muted)' }}>
                    {selectedCustomer.notes || (d.noTags as string)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[520px] rounded-[14px] overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>
                {editingCustomer ? d.modalEdit as string : d.modalAdd as string}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-[4px] transition-all" style={{ color: 'var(--fg-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <Field label={d.formName as string}>
                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 text-[13px] rounded-[6px] outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
              </Field>
              <Field label={d.formEmail as string}>
                <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 text-[13px] rounded-[6px] outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
              </Field>
              <Field label={d.formPhone as string}>
                <input type="text" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 text-[13px] rounded-[6px] outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
              </Field>
              <Field label={d.formCountry as string}>
                <input type="text" value={formData.country || ''} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 text-[13px] rounded-[6px] outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
              </Field>
              <Field label={d.formLanguages as string}>
                <input type="text" value={formData.languages || ''} onChange={(e) => setFormData({ ...formData, languages: e.target.value })} className="w-full px-3 py-2 text-[13px] rounded-[6px] outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
              </Field>
              <Field label={d.formVipLevel as string}>
                <select value={formData.vip_level || 'standard'} onChange={(e) => setFormData({ ...formData, vip_level: e.target.value })} className="w-full px-3 py-2 text-[13px] rounded-[6px] outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
                  <option value="standard">{d.vipNone as string}</option>
                  <option value="silver">{d.vipSilver as string}</option>
                  <option value="gold">{d.vipGold as string}</option>
                  <option value="platinum">{d.vipPlatinum as string}</option>
                </select>
              </Field>
              <Field label={d.formStatus as string}>
                <select value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 text-[13px] rounded-[6px] outline-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
                  <option value="active">{d.optionActive as string}</option>
                  <option value="inactive">{d.optionInactive as string}</option>
                </select>
              </Field>
              <Field label={d.formNotes as string}>
                <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 text-[13px] rounded-[6px] outline-none resize-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
              </Field>
            </div>
            <div className="px-6 py-4 flex gap-2 justify-end" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[13px] font-medium rounded-[6px] transition-all" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg)' }}>
                {d.cancel as string}
              </button>
              <button onClick={saveCustomer} className="px-4 py-2 text-[13px] font-medium rounded-[6px] transition-all text-white" style={{ background: 'var(--accent)' }}>
                {editingCustomer ? d.saveChanges as string : d.modalAdd as string}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium" style={{ color: 'var(--fg-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}
