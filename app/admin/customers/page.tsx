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

export default function CustomersPage() {
  const { t } = useI18n()
  const d = t.admin.customers

  const [customers, setCustomers] = useState<Customer[]>([])
  const [kpi, setKpi] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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
      const res = await fetch(`/api/admin/customers?${params.toString()}`)
      const data = await res.json()
      setCustomers(data.customers || [])
      setKpi(data.kpi || {})
    } catch (err) {
      console.error('Failed to fetch customers', err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

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
          <h1 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>{d.title as string}</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>{(d.subtitle as string).replace('{count}', String(kpi.total || customers.length))}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-2 text-[12px] font-medium rounded-[6px] transition-all flex items-center gap-1.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: d.kpiTotal, value: kpi.total ?? '—', sub: d.kpiSubTotal, color: 'var(--accent)' },
          { label: d.kpiActive, value: kpi.active ?? '—', sub: d.kpiSubActive, color: '#10b981' },
          { label: d.kpiInactive, value: kpi.inactive ?? '—', sub: d.kpiSubInactive, color: '#ef4444' },
          { label: d.kpiNew, value: kpi.new_month ?? '—', sub: d.kpiSubNew, color: '#3b82f6' },
          { label: d.kpiVip, value: kpi.vip ?? '—', sub: d.kpiSubVip, color: '#a855f7' },
          { label: d.kpiTrips, value: kpi.total_trips ?? '—', sub: d.kpiSubTrips, color: '#f59e0b' },
        ].map((card, i) => (
          <div key={i} className="rounded-[10px] p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] font-medium mb-2" style={{ color: 'var(--fg-muted)' }}>{card.label as string}</div>
            <div className="text-[22px] font-bold mb-1" style={{ color: card.color }}>{card.value}</div>
            <div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>{card.sub as string}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={d.search as string}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] rounded-[6px] outline-none transition-all"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-[12px] rounded-[6px] outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        >
          <option value="all">{d.filterAll as string}</option>
          <option value="active">{d.filterActive as string}</option>
          <option value="inactive">{d.filterInactive as string}</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableId as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableCustomer as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tablePhone as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableCountry as string}</th>
                <th className="text-center px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableTrips as string}</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableLtv as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableStatus as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableLastTrip as string}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableCreated as string}</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.6px]" style={{ color: 'var(--fg-muted)' }}>{d.tableActions as string}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-[14px]" style={{ color: 'var(--fg-muted)' }}>{d.loading as string}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-[14px]" style={{ color: 'var(--fg-muted)' }}>{d.noResults as string}</td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b last:border-b-0 transition-colors cursor-pointer"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => { setSelectedCustomer(customer); setDetailTab('profile') }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-5 py-3 text-[13px] font-mono" style={{ color: 'var(--fg-muted)' }}>#{customer.id}</td>
                    <td className="px-5 py-3">
                      <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>{customer.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>{customer.email}</div>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-mono" style={{ color: 'var(--fg-secondary)' }}>{customer.phone || '—'}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: 'var(--fg-secondary)' }}>{customer.country || '—'}</td>
                    <td className="px-5 py-3 text-[13px] text-center" style={{ color: 'var(--fg-secondary)' }}>{customer.total_trips}</td>
                    <td className="px-5 py-3 text-[13px] text-right font-medium" style={{ color: 'var(--fg)' }}>{formatCurrency(customer.lifetime_value)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGES[customer.status] || STATUS_BADGES['inactive']}`}>
                        {customer.status === 'active' ? d.statusActive as string : d.statusInactive as string}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: 'var(--fg-secondary)' }}>{formatDate(customer.last_trip_date)}</td>
                    <td className="px-5 py-3 text-[13px]" style={{ color: 'var(--fg-secondary)' }}>{formatDate(customer.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(customer)}
                          className="p-1.5 rounded-[4px] transition-all"
                          style={{ color: 'var(--fg-muted)' }}
                          title={d.titleEdit as string}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => deactivateCustomer(customer)}
                          className="p-1.5 rounded-[4px] transition-all"
                          style={{ color: 'var(--fg-muted)' }}
                          title={d.titleDeactivate as string}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
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
            <div className="flex border-b sticky top-[60px]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              {(['profile', 'reservations', 'preferences', 'support', 'tags'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className="px-4 py-3 text-[12px] font-medium transition-all relative"
                  style={{
                    color: detailTab === tab ? 'var(--accent)' : 'var(--fg-muted)',
                    borderBottom: detailTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
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
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileName as string}</div>
                      <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selectedCustomer.name}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileEmail as string}</div>
                      <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selectedCustomer.email}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profilePhone as string}</div>
                      <div className="text-[13px] font-mono" style={{ color: 'var(--fg)' }}>{selectedCustomer.phone || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileCountry as string}</div>
                      <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selectedCustomer.country || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileLanguages as string}</div>
                      <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selectedCustomer.languages || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileVipLevel as string}</div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${VIP_BADGES[selectedCustomer.vip_level] || VIP_BADGES['standard']}`}>
                        {vipLabel(d, selectedCustomer.vip_level)}
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileStatus as string}</div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGES[selectedCustomer.status] || STATUS_BADGES['inactive']}`}>
                        {selectedCustomer.status === 'active' ? d.statusActive as string : d.statusInactive as string}
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileMemberSince as string}</div>
                      <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{formatDate(selectedCustomer.created_at)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileTotalTrips as string}</div>
                      <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selectedCustomer.total_trips}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileLifetimeValue as string}</div>
                      <div className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(selectedCustomer.lifetime_value)}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>{d.profileLastTrip as string}</div>
                      <div className="text-[13px]" style={{ color: 'var(--fg)' }}>{formatDate(selectedCustomer.last_trip_date)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => openEdit(selectedCustomer)}
                      className="px-4 py-2 text-[12px] font-medium rounded-[6px] transition-all flex-1 text-center"
                      style={{ background: 'var(--accent)', color: 'white' }}
                    >
                      {d.modalEdit as string}
                    </button>
                  </div>
                </div>
              )}

              {detailTab === 'reservations' && (
                <div>
                  <p className="text-[13px] py-8 text-center" style={{ color: 'var(--fg-muted)' }}>{d.noReservations as string}</p>
                </div>
              )}

              {detailTab === 'preferences' && (
                <div>
                  <p className="text-[13px] py-8 text-center" style={{ color: 'var(--fg-muted)' }}>{d.noPreferences as string}</p>
                </div>
              )}

              {detailTab === 'support' && (
                <div>
                  <p className="text-[13px] py-8 text-center" style={{ color: 'var(--fg-muted)' }}>{d.noSupport as string}</p>
                </div>
              )}

              {detailTab === 'tags' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-[13px] font-medium mb-2" style={{ color: 'var(--fg)' }}>{d.tagsTitle as string}</div>
                    {(() => {
                      let tags: string[] = []
                      try { tags = JSON.parse(selectedCustomer.tags || '[]') } catch {}
                      return tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag, i) => (
                            <span key={i} className="px-2.5 py-1 text-[11px] font-medium rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>{tag}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>{d.noTags as string}</p>
                      )
                    })()}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium mb-2" style={{ color: 'var(--fg)' }}>{d.notesTitle as string}</div>
                    <p className="text-[13px]" style={{ color: selectedCustomer.notes ? 'var(--fg-secondary)' : 'var(--fg-muted)' }}>
                      {selectedCustomer.notes || (d.noTags as string)}
                    </p>
                  </div>
                </div>
              )}
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
        <div className="fixed bottom-6 right-6 z-[2000] px-4 py-3 rounded-[8px] text-[13px] font-medium shadow-lg animate-in" style={{ background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white' }}>
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
