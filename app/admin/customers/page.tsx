'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

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
      showToast('Error saving customer', 'error')
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
      showToast('Error deactivating customer', 'error')
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
       {/* Header */}
       <div className="flex items-center justify-between mb-5">
         <div>
           <h1 className="text-[18px] font-semibold text-fg">{d.title as string}</h1>
           <p className="text-[13px] mt-0.5 text-fg-muted">{(d.subtitle as string).replace('{count}', String(kpi.total || customers.length))}</p>
         </div>
         <div className="flex items-center gap-2">
           <button
             onClick={exportCsv}
             className="btn btn-secondary flex items-center gap-1.5"
           >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
             {d.export as string}
           </button>
           {/* <button
             onClick={openNew}
             className="px-4 py-2 text-[13px] font-medium rounded-[6px] transition-all flex items-center gap-1.5 text-white"
             style={{ background: 'var(--accent)' }}
           >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
             {d.add as string}
           </button> */}
         </div>
       </div>

{/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[14px] mb-6">
          {[
            { label: d.kpiTotalCustomers || 'Total Customers', value: kpi.total ?? '—', color: 'var(--accent)' },
            { label: d.kpiActiveMonth || 'Active This Month', value: kpi.active ?? '—', color: 'var(--info)' },
            { label: d.kpiVipCustomers || 'VIP Customers', value: kpi.vip ?? '—', color: 'var(--gold)' },
            { label: d.kpiReturningRate || 'Returning Rate', value: kpi.returning_rate ?? '—', color: 'var(--accent)' },
            { label: d.kpiAvgLtv || 'Avg. LTV', value: formatCurrency(kpi.avg_ltv ?? 0), color: 'var(--accent-soft)' },
            { label: d.kpiNpsScore || 'NPS Score', value: kpi.nps ?? '—', color: 'var(--gold)' },
          ].map((card, i) => (
            <div 
              key={i} 
              className="stat-card"
              style={{ 
                background: 'var(--surface)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)',
                padding: '18px 16px',
                textAlign: 'center',
                transition: 'all var(--transition)'
              }}
            >
              <div 
                className="stat-value" 
                style={{ 
                  fontSize: '26px', 
                  fontWeight: 700, 
                  lineHeight: 1.1, 
                  color: card.color 
                }}
              >
                {card.value}
              </div>
              <div 
                className="stat-label" 
                style={{ 
                  fontSize: '11px', 
                  color: 'var(--fg-muted)', 
                  fontWeight: 500, 
                  marginTop: '4px' 
                }}
              >
                {card.label}
              </div>
            </div>
          ))}
        </div>

       {/* Toolbar */}
       <div className="flex items-center gap-3 mb-4 flex-wrap">
         <div className="relative flex-1 min-w-[200px] max-w-[320px]">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
           <input
             type="text"
             placeholder={d.search as string}
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="input w-full"
           />
         </div>
<select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select"
          >
            <option value="all">{d.filterAll as string}</option>
            <option value="active">{d.filterActive as string}</option>
            <option value="inactive">{d.filterInactive as string}</option>
          </select>
          <select
            value={vipFilter}
            onChange={(e) => setVipFilter(e.target.value)}
            className="select"
          >
            <option value="all">{d.vipFilterAll || 'All VIP Levels'}</option>
            <option value="platinum">{d.vipPlatinum as string}</option>
            <option value="gold">{d.vipGold as string}</option>
            <option value="silver">{d.vipSilver as string}</option>
            <option value="standard">{d.vipNone as string}</option>
          </select>
       </div>

       {/* Table */}
       <div className="table-wrap">
         <table>
           <thead>
             <tr>
               <th>{d.tableId as string}</th>
               <th>{d.tableCustomer as string}</th>
               <th>{d.tablePhone as string}</th>
               <th>{d.tableCountry as string}</th>
               <th>{d.tableTrips as string}</th>
               <th>{d.tableLtv as string}</th>
               <th>{d.tableStatus as string}</th>
               <th>{d.tableLastTrip as string}</th>
               <th>{d.tableCreated as string}</th>
               <th>{d.tableActions as string}</th>
             </tr>
           </thead>
<tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">{d.loading as string}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">{d.noResults as string}</td>
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
                      <div className="customer-name-cell">
                        <div 
                          className="customer-avatar" 
                          style={{ 
                            background: getAvatarBg(customer.vip_level), 
                            color: getAvatarColor(customer.vip_level) 
                          }}
                        >
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-fg-muted text-xs">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="country-flag">{getCountryFlag(customer.country)}</span> {customer.country || '—'}
                    </td>
                    <td>
                      <span className={`badge ${customer.status === 'active' ? 'badge-accent' : 'badge-warning'}`}>
                        {customer.status === 'active' ? d.statusActive as string : d.statusInactive as string}
                      </span>
                    </td>
                    <td className="text-fg-secondary text-xs">{getRelativeTime(customer.last_trip_date)}</td>
                    <td className="font-semibold">{customer.total_trips}</td>
                    <td className="font-semibold font-mono">{formatCurrency(customer.lifetime_value)}</td>
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

        {/* Slide-in Detail Panel */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-[1000] flex justify-end" onClick={() => setSelectedCustomer(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="relative w-full max-w-[520px] h-full overflow-y-auto"
              style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel Header */}
              <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[15px]" style={{ background: 'var(--accent)' }}>
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{selectedCustomer.name}</div>
                    <div className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>#{selectedCustomer.id}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-1.5 rounded-[4px] transition-all" style={{ color: 'var(--fg-muted)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="tabs sticky top-[60px]">
                {(['profile', 'reservations', 'preferences', 'support', 'tags'] as TabKey[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={detailTab === tab ? 'tab-active' : ''}
                  >
                    {d[`detail${tab.charAt(0).toUpperCase() + tab.slice(1)}` as keyof typeof d] as string || tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {detailTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileName as string}</div>
                        <div className="base-text text-fg">{selectedCustomer.name}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileEmail as string}</div>
                        <div className="base-text text-fg">{selectedCustomer.email}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profilePhone as string}</div>
                        <div className="base-text text-fg">{selectedCustomer.phone || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileCountry as string}</div>
                        <div className="base-text text-fg">{selectedCustomer.country || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileLanguages as string}</div>
                        <div className="base-text text-fg">{selectedCustomer.languages || '—'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileVipLevel as string}</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${VIP_BADGES[selectedCustomer.vip_level] || VIP_BADGES['standard']}`}>
                          {vipLabel(d, selectedCustomer.vip_level)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileStatus as string}</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${STATUS_BADGES[selectedCustomer.status] || STATUS_BADGES['inactive']}`}>
                          {selectedCustomer.status === 'active' ? d.statusActive as string : d.statusInactive as string}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileMemberSince as string}</div>
                        <div className="base-text text-fg">{formatDate(selectedCustomer.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileTotalTrips as string}</div>
                        <div className="base-text text-fg">{selectedCustomer.total_trips}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileLifetimeValue as string}</div>
                        <div className="base-text font-semibold text-accent">{formatCurrency(selectedCustomer.lifetime_value)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg-muted mb-1">{d.profileLastTrip as string}</div>
                        <div className="base-text text-fg">{formatDate(selectedCustomer.last_trip_date)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => openEdit(selectedCustomer)}
                        className="btn btn-primary w-full"
                      >
                        {d.modalEdit as string}
                      </button>
                    </div>
                  </div>
                )}

                {detailTab === 'reservations' && (
                  <div className="py-8 text-center text-fg-muted">
                    {d.noReservations as string}
                  </div>
                )}

                {detailTab === 'preferences' && (
                  <div className="py-8 text-center text-fg-muted">
                    {d.noPreferences as string}
                  </div>
                )}

                {detailTab === 'support' && (
                  <div>
                    <p className="text-[13px] py-8 text-center" style={{ color: 'var(--fg-muted)' }}>{d.noSupport as string}</p>
                  </div>
                )}

                {detailTab === 'tags' && (
                  <div className="space-y-6">
                    <div className="text-[13px] font-medium mb-2" style={{ color: 'var(--fg)' }}>{d.tagsTitle as string}</div>
                    {(() => {
                      let tags: string[] = []
                      try { tags = JSON.parse(selectedCustomer.tags || '[]') } catch {}
                      return tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag, i) => (
                            <span key={i} className="px-2.5 py-1 text-[11px] font-medium rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--info)' }}>{tag}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>{d.noTags as string}</p>
                      )
                    })()}
                  </div>
                )}

                {/* Notes section */}
                <div className="space-y-6">
                  <div className="text-[13px] font-medium mb-2" style={{ color: 'var(--fg)' }}>{d.notesTitle as string}</div>
                  <p className="text-[13px]" style={{ color: selectedCustomer.notes ? 'var(--fg-secondary)' : 'var(--fg-muted)' }}>
                    {selectedCustomer.notes || (d.noTags as string)}
                  </p>
                </div>
              </div>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[2000] px-4 py-3 rounded-[8px] text-[13px] font-medium shadow-lg animate-in" style={{ background: toast.type === 'success' ? 'var(--accent)' : 'var(--danger)', color: 'white' }}>
          {toast.message}
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
