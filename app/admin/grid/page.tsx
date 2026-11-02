'use client'

import { useState, useEffect, useMemo } from 'react'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { RealtimeProvider } from '@/lib/admin/realtime-context'
import { useToast } from '@/lib/admin/toast-context'
import { getTimeAgo } from '@/lib/date-utils'

interface PaymentTransaction {
  booking_reference: string
  package_id: string
  package_name: string
  amount: number
  currency: string
  status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  created_at: string
  error_message: string | null
}

interface RevenueItem {
  package_name: string
  amount: number
  percentage: string
  count: number
}

interface PayoutItem {
  id: number
  order_number: string
  booking_reference: string
  customer_name: string
  package_name: string
  package_price: number
  currency: string
  payment_status: string
  driver_name: string
  driver_vehicle: string
  driver_plate: string
  driver_total_trips: number
  driver_payment_cop: number
  driver_payment_usd: number
  gross_revenue: number
  created_at: string
}

interface PaymentData {
  kpis: {
    totalRevenue: number
    successfulCount: number
    failedCount: number
    pendingCount: number
    successfulRate: string
    failureRate: string
    driverPayouts: number
    driverPayoutsPct: string
    platformBalance: number
  }
  revenueByService: RevenueItem[]
  transactions: PaymentTransaction[]
  payouts: PayoutItem[]
  summary: {
    avgTransaction: number
    totalCardPayments: number
    refundsTotal: number
    chargebacks: number
    pendingPayout: number
    lastPayout: number
  }
  trm: {
    rate: number
    fetchedAt: string
    source: string
  }
}

const SERVICE_COLORS: Record<string, string> = {
  'The VIP Arrival': 'var(--accent)',
  'smooth-landing': 'var(--accent)',
  'The 24h Insider': 'var(--warning)',
  'first-24': 'var(--warning)',
  'The Peace of Mind': 'var(--info)',
  'full-insider': 'var(--info)',
}

function PaymentsInner() {
  const { t } = useI18n()
  const d = t.admin.payments as Record<string, string>
  const [data, setData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null)
  const [platformFee, setPlatformFee] = useState({ percent: 0.10, fixed: 0.30 })
  const { showToast } = useToast()

  useEffect(() => {
    adminFetch('/api/admin/payments')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => setPlatformFee({
        percent: cfg.platformFeePercent ?? 0.10,
        fixed: cfg.platformFeeFixed ?? 0.30,
      }))
      .catch(() => {})
  }, [])

  const filteredTransactions = useMemo(() => {
    if (!data) return []
    let txs = data.transactions
    if (filter !== 'all') {
      txs = txs.filter(t => t.status === filter)
    }
    if (search) {
      const q = search.toLowerCase()
      txs = txs.filter(t =>
        t.booking_reference.toLowerCase().includes(q) ||
        t.customer_name.toLowerCase().includes(q)
      )
    }
    return txs
  }, [data, filter, search])

  const statusColors: Record<string, string> = {
    completed: 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]',
    pending: 'bg-[var(--ui-warning-soft)] text-[var(--ui-warning)]',
    refunded: 'bg-[var(--ui-danger-soft)] text-[var(--ui-danger)]',
    failed: 'bg-[var(--ui-danger-soft)] text-[var(--ui-danger)]',
  }
  const statusLabels: Record<string, string> = {
    completed: d.completed || 'Completed',
    pending: d.pending || 'Pending',
    refunded: d.refundedStatus || 'Refunded',
    failed: d.failed || 'Failed',
  }
  const payoutStatusColors: Record<string, string> = {
    paid: 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]',
    completed: 'bg-[var(--ui-accent-soft)] text-[var(--ui-accent)]',
    pending: 'bg-[var(--ui-warning-soft)] text-[var(--ui-warning)]',
  }

  const openDetail = (tx: PaymentTransaction) => setSelectedTx(tx)
  const closeDetail = () => setSelectedTx(null)

  const handleRefund = async (ref: string) => {
    if (!confirm(d.refundConfirm || 'Are you sure you want to refund this transaction?')) return
    try {
      const res = await adminFetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_reference: ref, reason: 'Admin initiated refund' }),
      })
      const result = await res.json()
      if (result.success) {
        showToast((d.refundInitiated || 'Refund processed for {id}').replace('{id}', ref))
        // Reload data
        const freshRes = await adminFetch('/api/admin/payments')
        const freshData = await freshRes.json()
        setData(freshData)
      } else {
        showToast(`Refund failed: ${result.error}`)
      }
    } catch (err) {
      showToast('Refund failed. Please try again.')
      console.error('Refund error:', err)
    }
    closeDetail()
  }

  const getServiceColor = (name: string) => {
    for (const [key, color] of Object.entries(SERVICE_COLORS)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return color
    }
    return 'var(--accent-soft)'
  }

  const formatDate = (dateStr: string) => getTimeAgo(dateStr)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--ui-fg-secondary)]">{t.common.loading || 'Loading...'}</div>
      </div>
    )
  }

  if (!data) return null

  const r = data.revenueByService
  const topRevenue = r.length > 0 ? Math.max(...r.map(x => Number(x.percentage))) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--ui-fg)]">{d.title || 'Payments'}</h1>
          <p className="text-[13px] text-[var(--ui-fg-secondary)] mt-1">{d.subtitle || ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {data.trm && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-[6px]">
              <span className="text-[11px] text-[var(--ui-fg-secondary)]">TRM</span>
              <span className="text-[13px] font-semibold text-[var(--ui-accent)]">${data.trm.rate.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-[var(--ui-fg-secondary)]">COP/USD</span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div>
        <div className="section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--ui-fg-secondary)]">
            {d.financialOverview || 'Financial Overview'}
          </span>
          <span className="ml-auto text-[10px] font-normal text-[var(--ui-fg-secondary)]">
            {(d.updated || 'Updated {time} ago').replace('{time}', '5 min')}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Total Revenue */}
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] p-4 hover:border-[var(--ui-accent)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.3)] transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-[6px] bg-[rgba(16,185,129,0.12)] flex items-center justify-center text-[var(--ui-accent)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--ui-fg-secondary)] mb-0.5">{d.totalRevenue || 'Total Revenue (All Time)'}</div>
            <div className="text-[24px] font-bold text-[var(--ui-fg)] leading-[1.1]">${data.kpis.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--ui-accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              +{(data.kpis.successfulRate || 0)}% {d.vsLastMonth || 'vs last month'}
            </div>
          </div>

          {/* Successful Payments */}
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] p-4 hover:border-[var(--ui-accent)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.3)] transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-[6px] bg-[rgba(16,185,129,0.12)] flex items-center justify-center text-[var(--ui-accent)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--ui-fg-secondary)] mb-0.5">{d.successfulPayments || 'Successful Payments'}</div>
            <div className="text-[24px] font-bold text-[var(--ui-fg)] leading-[1.1]">{data.kpis.successfulCount.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--ui-accent)]">
              {(d.successRate || '{rate}% success rate').replace('{rate}', data.kpis.successfulRate)}
            </div>
          </div>

          {/* Failed / Declined */}
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] p-4 hover:border-[var(--ui-danger)] hover:shadow-[0_0_0_1px_rgba(239,68,80,0.3)] transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-[6px] bg-[var(--ui-danger-soft)] flex items-center justify-center text-[var(--ui-danger)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--ui-fg-secondary)] mb-0.5">{d.failedDeclined || 'Failed / Declined'}</div>
            <div className="text-[24px] font-bold text-[var(--ui-fg)] leading-[1.1]">{data.kpis.failedCount}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--ui-danger)]">
              {(d.failureRate || '{rate}% failure rate').replace('{rate}', data.kpis.failureRate)}
            </div>
          </div>

          {/* Pending */}
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] p-4 hover:border-[var(--ui-warning)] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.3)] transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-[6px] bg-[rgba(245,158,11,0.12)] flex items-center justify-center text-[var(--ui-warning)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--ui-fg-secondary)] mb-0.5">{d.pending || 'Pending'}</div>
            <div className="text-[24px] font-bold text-[var(--ui-fg)] leading-[1.1]">{data.kpis.pendingCount}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--ui-fg-secondary)]">
              {d.awaitingConfirmation || 'Awaiting confirmation'}
            </div>
          </div>

          {/* Driver Payouts */}
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] p-4 hover:border-[var(--ui-warning)] hover:shadow-[0_0_0_1px_rgba(245,158,11,0.3)] transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-[6px] bg-[rgba(245,158,11,0.12)] flex items-center justify-center text-[var(--ui-warning)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--ui-fg-secondary)] mb-0.5">{d.driverPayouts || 'Driver Payouts (All Time)'}</div>
            <div className="text-[24px] font-bold text-[var(--ui-fg)] leading-[1.1]">${data.kpis.driverPayouts.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--ui-fg-secondary)]">
              {(d.ofRevenue || '{pct}% of revenue').replace('{pct}', data.kpis.driverPayoutsPct)}
            </div>
          </div>

          {/* Platform Balance */}
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] p-4 hover:border-[var(--ui-accent)] hover:shadow-[0_0_0_1px_rgba(20,184,166,0.3)] transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-[6px] bg-[rgba(20,184,166,0.12)] flex items-center justify-center text-[var(--ui-accent)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
            </div>
            <div className="text-[11px] font-medium text-[var(--ui-fg-secondary)] mb-0.5">{d.platformBalance || 'Platform Balance'}</div>
            <div className="text-[24px] font-bold text-[var(--ui-fg)] leading-[1.1]">${data.kpis.platformBalance.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1.5 text-[12px] font-medium text-[var(--ui-accent)]">
              {d.availableForPayout || 'Available for payout'}
            </div>
          </div>
        </div>
      </div>

      {/* ── REVENUE BY SERVICE ── */}
      {r.length > 0 && (
        <div>
          <div className="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--ui-fg-secondary)]">
              {d.revenueByService || 'Revenue by Service'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {r.map((item, idx) => {
              const color = getServiceColor(item.package_name)
              return (
                <div key={idx} className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] p-5 text-center hover:border-[var(--ui-accent)] transition-all">
                  <div className="text-[22px] font-bold font-mono leading-[1.1]" style={{ color }}>
                    ${item.amount.toLocaleString()}
                  </div>
                  <div className="text-[18px] font-semibold mt-1" style={{ color: 'var(--accent)' }}>
                    {item.percentage}%
                  </div>
                  <div className="text-[12px] text-[var(--ui-fg-secondary)] mt-1.5 font-medium">{item.package_name}</div>
                  <div className="mt-3 h-1.5 bg-[var(--ui-surface-hover)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(Number(item.percentage) / (topRevenue || 1)) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PAYMENT TRANSACTIONS + PADDLE ── */}
      <div>
        <div className="section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--ui-fg-secondary)]">
            {d.paymentTransactions || 'Payment Transactions'}
          </span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
          {/* Transactions Table */}
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--ui-border)]">
              <span className="text-[13px] font-semibold text-[var(--ui-fg)]">{d.recentTransactions || 'Recent Transactions'}</span>
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1">
                  {['all', 'completed', 'pending', 'refunded', 'failed'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                        filter === s
                          ? 'bg-[rgba(16,185,129,0.12)] text-[var(--ui-accent)] border border-[var(--ui-accent)]'
                          : 'text-[var(--ui-fg-secondary)] border border-[var(--ui-border)] hover:border-[var(--ui-fg-secondary)]'
                      }`}
                    >
                      {s === 'all' ? (d.all || 'All') : (statusLabels[s] || s)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => showToast('Export initiated')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ui-accent)] text-white text-[12px] font-medium rounded-[6px] hover:bg-[#059669] transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {d.export || 'Export'}
                </button>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-[var(--ui-border)]">
              <input
                type="text"
                placeholder={d.searchTransactions || 'Search transactions...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-[6px] text-[13px] text-[var(--ui-fg)] placeholder:text-[var(--ui-fg-secondary)] outline-none focus:border-[var(--ui-accent)] transition-all"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--ui-bg-secondary)] border-b border-[var(--ui-border)]">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.transactionId || 'Transaction ID'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.customer || 'Customer'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.package || 'Package'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.amount || 'Amount'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.status || 'Status'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.date || 'Date'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, idx) => (
                    <tr key={idx} className="border-b border-[var(--ui-border)] hover:bg-[var(--ui-surface-hover)] transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono text-[var(--ui-fg-secondary)]">{tx.booking_reference}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-medium text-[var(--ui-fg)]">{tx.customer_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] text-[var(--ui-fg-secondary)]">{tx.package_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-semibold font-mono text-[var(--ui-fg)]">${tx.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColors[tx.status] || ''}`}>
                          {statusLabels[tx.status] || tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-[var(--ui-fg-secondary)]">{formatDate(tx.created_at)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => openDetail(tx)}
                          className="p-1.5 hover:bg-[var(--ui-surface-hover)] rounded-[4px] text-[var(--ui-fg-secondary)] transition-all"
                          title="View details"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="p-10 text-center text-[var(--ui-fg-secondary)] text-[13px]">
                {d.noTransactions || 'No transactions found'}
              </div>
            )}
          </div>

           {/* Polar Integration Sidebar */}
          <div className="space-y-4">
            {/* Polar Card */}
            <div className="bg-gradient-to-br from-[rgba(99,102,241,0.08)] to-[rgba(139,92,246,0.06)] border border-[rgba(99,102,241,0.2)] rounded-[10px] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-[6px] bg-[rgba(99,102,241,0.12)] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ui-info)" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-[var(--ui-fg)]">{d.polarIntegration || 'Polar Integration'}</div>
                  <div className="text-[11px] text-[var(--ui-fg-secondary)]">{d.paymentProcessing || 'Payment processing with Polar'}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.12)] text-[var(--ui-accent)]">
                  {d.connected || 'Connected'}
                </span>
              </div>
              <div className="border-t border-[rgba(99,102,241,0.15)] pt-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--ui-fg-secondary)]">{d.connectionStatus || 'Connection Status'}</span>
                  <span className="font-semibold text-[var(--ui-accent)]">● {d.connected || 'Connected'}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--ui-fg-secondary)]">{d.payoutSchedule || 'Payout Schedule'}</span>
                  <span className="font-semibold text-[var(--ui-fg)]">{d.dailyAuto || 'Daily (automatic)'}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--ui-fg-secondary)]">{d.pendingPayout || 'Pending Payout'}</span>
                  <span className="font-semibold font-mono text-[var(--ui-warning)]">${data.summary.pendingPayout.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--ui-fg-secondary)]">{d.lastPayout || 'Last Payout'}</span>
                  <span className="font-semibold font-mono text-[var(--ui-fg)]">${data.summary.lastPayout.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--ui-fg-secondary)]">Currency</span>
                  <span className="font-semibold text-[var(--ui-fg)]">USD</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => showToast('Opening Polar dashboard...')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--ui-accent)] text-white text-[12px] font-medium rounded-[6px] hover:bg-[#059669] transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {d.polarDashboard || 'Polar Dashboard'}
                </button>
                <button
                  onClick={() => showToast('Payout settings')}
                  className="p-2 bg-[var(--ui-surface-hover)] text-[var(--ui-fg-secondary)] rounded-[6px] hover:bg-[var(--ui-border-light)] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--ui-border)]">
                <span className="text-[13px] font-semibold text-[var(--ui-fg)]">{d.paymentSummary || 'Payment Summary'}</span>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--ui-fg-secondary)]">{d.avgTransaction || 'Avg. Transaction'}</span>
                  <span className="text-[14px] font-semibold font-mono text-[var(--ui-fg)]">${data.summary.avgTransaction.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--ui-fg-secondary)]">{d.cardPayments || 'Card Payments'}</span>
                  <span className="text-[14px] font-semibold font-mono text-[var(--ui-accent)]">
                    ${data.summary.totalCardPayments.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-[var(--ui-border)] pt-2.5 flex items-center justify-between">
                  <span className="text-[12px] text-[var(--ui-fg-secondary)]">{d.refunds || 'Refunds (All Time)'}</span>
                  <span className="text-[14px] font-semibold font-mono text-[var(--ui-danger)]">
                    ${data.summary.refundsTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--ui-fg-secondary)]">{d.chargebacks || 'Chargebacks'}</span>
                  <span className="text-[14px] font-semibold font-mono text-[var(--ui-danger)]">
                    ${data.summary.chargebacks.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DRIVER PAYOUTS ── */}
      {data.payouts.length > 0 && (
        <div>
          <div className="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[var(--ui-fg-secondary)]">
              {d.driverPayoutsTitle || 'Driver Payouts'}
            </span>
            <span className="ml-auto text-[10px] font-normal text-[var(--ui-fg-secondary)]">
              {d.nextPayout || 'Next payout: Tomorrow'}
            </span>
          </div>
          <div className="bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-[10px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--ui-bg-secondary)] border-b border-[var(--ui-border)]">
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.driver || 'Driver'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.trips || 'Trips'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.payoutAmount || 'Payment (COP)'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.payoutAmount || 'Payment (USD)'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.payoutStatus || 'Status'}</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--ui-fg-secondary)] px-5 py-3">{d.payoutDate || 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.map((p, idx) => {
                    const isCompleted = p.payment_status === 'paid' || p.payment_status === 'completed'
                    return (
                      <tr key={idx} className="border-b border-[var(--ui-border)] hover:bg-[var(--ui-surface-hover)] transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] font-medium text-[var(--ui-fg)]">{p.driver_name || p.customer_name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] font-mono text-[var(--ui-fg)]">{p.driver_name ? p.driver_total_trips : '-'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] font-semibold font-mono text-[var(--ui-fg)]">$ {p.driver_payment_cop.toLocaleString()} COP</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] font-semibold font-mono text-[var(--ui-accent)]">${p.driver_payment_usd.toLocaleString()} USD</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${isCompleted ? payoutStatusColors.paid : payoutStatusColors.pending}`}>
                            {isCompleted ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] text-[var(--ui-fg-secondary)]">{formatDate(p.created_at)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACTION DETAIL MODAL ── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--ui-border)]">
              <div>
                <h2 className="text-lg font-semibold text-[var(--ui-fg)]">{d.transactionDetails || 'Transaction Details'}</h2>
                <p className="text-[12px] text-[var(--ui-fg-secondary)]">{formatDate(selectedTx.created_at)}</p>
              </div>
              <button onClick={closeDetail} className="p-2 hover:bg-[var(--ui-surface-hover)] rounded-lg transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ui-fg-secondary)" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status + ID */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[20px] font-bold text-[var(--ui-fg)]">{selectedTx.booking_reference}</div>
                  <div className="text-[12px] text-[var(--ui-fg-secondary)]">{selectedTx.customer_name}</div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColors[selectedTx.status] || ''}`}>
                  {statusLabels[selectedTx.status] || selectedTx.status}
                </span>
              </div>

              {/* Detail Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.3px] font-medium text-[var(--ui-fg-secondary)]">{d.customer || 'Customer'}</span>
                  <span className="text-[13px] font-medium text-[var(--ui-fg)]">{selectedTx.customer_name}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.3px] font-medium text-[var(--ui-fg-secondary)]">{d.contact || 'Contact'}</span>
                  <span className="text-[13px] font-medium font-mono text-[var(--ui-fg)]">{selectedTx.customer_email}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.3px] font-medium text-[var(--ui-fg-secondary)]">{d.package || 'Package'}</span>
                  <span className="text-[13px] font-medium text-[var(--ui-fg)]">{selectedTx.package_name}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.3px] font-medium text-[var(--ui-fg-secondary)]">{d.amount || 'Amount'}</span>
                  <span className="text-[18px] font-bold font-mono text-[var(--ui-accent)]">${selectedTx.amount.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.3px] font-medium text-[var(--ui-fg-secondary)]">{d.paymentMethod || 'Payment Method'}</span>
                  <span className="text-[13px] font-medium text-[var(--ui-fg)]">Polar</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.3px] font-medium text-[var(--ui-fg-secondary)]">{d.status || 'Status'}</span>
                  <span className="text-[13px] font-medium text-[var(--ui-fg)]">{statusLabels[selectedTx.status] || selectedTx.status}</span>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="p-4 bg-[var(--ui-bg)] rounded-[6px] border border-[var(--ui-border)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--ui-fg-secondary)] mb-2">
                  {d.amountBreakdown || 'Amount Breakdown'}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px] text-[var(--ui-fg-secondary)]">
                    <span>{d.subtotal || 'Subtotal'}</span>
                    <span className="font-mono">${selectedTx.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[var(--ui-fg-secondary)]">
                    <span>{d.processingFee || `Processing Fee (${(platformFee.percent * 100).toFixed(1)}% + $${platformFee.fixed.toFixed(2)})`}</span>
                    <span className="font-mono">${(selectedTx.amount * platformFee.percent + platformFee.fixed).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[14px] font-semibold pt-2 border-t border-[var(--ui-border)] mt-2">
                    <span>{d.totalCharged || 'Total Charged'}</span>
                    <span className="font-mono text-[var(--ui-accent)]">${selectedTx.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Timeline */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--ui-fg-secondary)] mb-2">
                  {d.paymentTimeline || 'Payment Timeline'}
                </div>
                <div className="space-y-2">
                  {(selectedTx.status === 'completed' ? [
                    { dot: 'var(--accent)', title: d.paymentInitiated || 'Payment Initiated', desc: (d.transactionCreated || 'Transaction created and sent to processor'), time: formatDate(selectedTx.created_at) },
                    { dot: 'var(--accent)', title: d.authorized || 'Authorized', desc: d.authorizedDesc || 'Payment authorized by bank', time: formatDate(selectedTx.created_at) },
                    { dot: 'var(--accent)', title: d.captured || 'Captured', desc: d.capturedDesc || 'Funds captured successfully', time: formatDate(selectedTx.created_at) },
                    { dot: 'var(--accent)', title: d.settled || 'Settled', desc: d.settledDesc || 'Funds settled to Polar balance', time: formatDate(selectedTx.created_at) },
                  ] : selectedTx.status === 'pending' ? [
                    { dot: 'var(--accent)', title: d.paymentInitiated || 'Payment Initiated', desc: d.transactionCreated || 'Transaction created', time: formatDate(selectedTx.created_at) },
                    { dot: 'var(--info)', title: d.awaitingConfirmation || 'Awaiting Confirmation', desc: d.awaitingConfirmationDesc || 'Waiting for payment confirmation', time: formatDate(selectedTx.created_at), glow: true },
                    { dot: 'var(--border)', title: d.captured || 'Captured', desc: '' },
                    { dot: 'var(--border)', title: d.settled || 'Settled', desc: '' },
                  ] : selectedTx.status === 'refunded' ? [
                    { dot: 'var(--accent)', title: d.paymentInitiated || 'Payment Initiated', desc: d.transactionCreated || 'Transaction created', time: formatDate(selectedTx.created_at) },
                    { dot: 'var(--accent)', title: d.captured || 'Captured', desc: d.capturedDesc || 'Funds captured', time: formatDate(selectedTx.created_at) },
                    { dot: 'var(--accent)', title: d.settled || 'Settled', desc: d.settledDesc || 'Funds settled', time: formatDate(selectedTx.created_at) },
                    { dot: 'var(--danger)', title: d.refunded || 'Refunded', desc: d.refundedDesc || 'Full refund processed', time: formatDate(selectedTx.created_at), glow: true },
                  ] : [
                    { dot: 'var(--accent)', title: d.paymentInitiated || 'Payment Initiated', desc: d.transactionCreated || 'Transaction created', time: formatDate(selectedTx.created_at) },
                    { dot: 'var(--danger)', title: d.failed || 'Failed', desc: d.failedDesc || 'Payment was declined by bank', time: formatDate(selectedTx.created_at), glow: true },
                  ]).map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                        style={{
                          background: step.dot,
                          boxShadow: (step as any).glow ? `0 0 6px ${step.dot}` : undefined,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[var(--ui-fg)]">{step.title}</div>
                        <div className="text-[11px] text-[var(--ui-fg-secondary)]">
                          {step.desc}{step.time ? ` · ${step.time}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-5 border-t border-[var(--ui-border)]">
              <button onClick={closeDetail} className="px-4 py-2 text-[13px] font-medium text-[var(--ui-fg-secondary)] hover:bg-[var(--ui-surface-hover)] rounded-[6px] transition-all">
                {d.close || 'Close'}
              </button>
              {(selectedTx.status === 'completed' || selectedTx.status === 'pending') && (
                <button
                  onClick={() => handleRefund(selectedTx.booking_reference)}
                  className="px-4 py-2 text-[13px] font-medium text-white bg-[rgba(239,68,80,0.2)] text-[var(--ui-danger)] rounded-[6px] hover:bg-[rgba(239,68,80,0.3)] transition-all"
                >
                  {d.refundPayment || 'Refund Payment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
      `}</style>
    </div>
  )
}

export default function GridPage() {
  return (
      <I18nProvider>
        <PaymentsInner />
      </I18nProvider>
  )
}
