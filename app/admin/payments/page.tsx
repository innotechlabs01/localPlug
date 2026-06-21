'use client'

import { useEffect, useState, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/admin/toast-context'

interface Payment {
  id: string; guest: string; service: string; amount: number; fee: number; net: number
  date: string; status: 'completed' | 'pending' | 'refunded' | 'failed'; method: string
  email?: string
  phone?: string
  errorMessage?: string | null
}

interface ApiTransaction {
  booking_reference: string
  package_name: string
  amount: number
  currency: string
  status: Payment['status']
  customer_name: string
  customer_email: string
  customer_phone: string
  created_at: string
  error_message: string | null
}

interface ApiPayout {
  id: number
  order_number: string
  booking_reference: string
  customer_name: string
  package_name: string
  payment_status: string
  driver_name: string | null
  driver_payment_usd: number
  created_at: string
}

interface PaymentsApiResponse {
  kpis: {
    totalRevenue: number
    successfulCount: number
    failedCount: number
    pendingCount: number
    driverPayouts: number
    stripeBalance: number
  }
  revenueByService: Array<{ package_name: string; amount: number; percentage: string; count: number }>
  transactions: ApiTransaction[]
  payouts: ApiPayout[]
  summary: {
    totalCardPayments: number
    refundsTotal: number
    pendingPayout: number
    lastPayout: number
  }
}

const formatCurrency = (val: number) => '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2 })

const statusBadges: Record<string, string> = {
  completed: 'badge-status completed',
  pending: 'badge-status pending',
  refunded: 'badge-status refunded',
  failed: 'badge-status failed',
}

const filters = ['all', 'completed', 'pending', 'refunded', 'failed'] as const

export default function PaymentsPage() {
  const { t } = useI18n()
  const d = (t.admin as any).payments ?? {}
  const [filter, setFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [data, setData] = useState<PaymentsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stripeFee, setStripeFee] = useState({ percent: 0.029, fixed: 0.30 })

  useEffect(() => {
    let mounted = true

    async function loadPayments() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/admin/payments', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load payments')
        const payload = await response.json()
        if (mounted) setData(payload)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load payments')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPayments()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => setStripeFee({
        percent: cfg.stripeFeePercent ?? 0.029,
        fixed: cfg.stripeFeeFixed ?? 0.30,
      }))
      .catch(() => {})
  }, [])

  const { showToast } = useToast()

  const filtered = useMemo(() => {
    const payments = (data?.transactions || []).map((payment): Payment => ({
      id: payment.booking_reference,
      guest: payment.customer_name || payment.customer_email || 'Unknown customer',
      service: payment.package_name || 'Unassigned package',
      amount: payment.amount,
      fee: 0,
      net: payment.amount,
      date: payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-US') : '',
      status: payment.status,
      method: 'Stripe',
      email: payment.customer_email,
      phone: payment.customer_phone,
      errorMessage: payment.error_message,
    }))
    if (filter === 'all') return payments
    return payments.filter(p => p.status === filter)
  }, [data?.transactions, filter])

  const payments = useMemo(() => {
    return (data?.transactions || []).map((payment): Payment => ({
      id: payment.booking_reference,
      guest: payment.customer_name || payment.customer_email || 'Unknown customer',
      service: payment.package_name || 'Unassigned package',
      amount: payment.amount,
      fee: 0,
      net: payment.amount,
      date: payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-US') : '',
      status: payment.status,
      method: 'Stripe',
      email: payment.customer_email,
      phone: payment.customer_phone,
      errorMessage: payment.error_message,
    }))
  }, [data?.transactions])

  const kpi = useMemo(() => {
    const apiKpis = data?.kpis
    const summary = data?.summary
    const totalRev = apiKpis?.totalRevenue ?? payments.reduce((s, p) => s + p.amount, 0)
    const totalFees = payments.reduce((s, p) => s + p.fee, 0)
    const totalNet = summary?.totalCardPayments ?? payments.reduce((s, p) => s + p.net, 0)
    const completed = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
    const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
    const refunds = summary?.refundsTotal ?? payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0)
    const successfulCount = apiKpis?.successfulCount ?? payments.filter(p => p.status === 'completed').length
    const failedCount = apiKpis?.failedCount ?? payments.filter(p => p.status === 'failed').length
    const pendingCount = apiKpis?.pendingCount ?? payments.filter(p => p.status === 'pending').length
    const driverPayouts = apiKpis?.driverPayouts ?? 0
    const stripeBalance = apiKpis?.stripeBalance ?? totalNet - refunds
    return { totalRev, totalFees, totalNet, completed, pending, refunds, successfulCount, failedCount, pendingCount, driverPayouts, stripeBalance }
  }, [data?.kpis, data?.summary, payments])

  const payouts = useMemo(() => {
    return (data?.payouts || []).map((payout) => {
      const driver = payout.driver_name || 'Unassigned driver'
      const init = driver
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('') || 'NA'

      return {
        driver,
        amount: payout.driver_payment_usd,
        date: payout.created_at ? new Date(payout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
        init,
      }
    })
  }, [data?.payouts])

  const selected = useMemo(() => payments.find(p => p.id === selectedId), [payments, selectedId])

  return (
    <div className="pay-page">
      {/* ── KPI ROW ── */}
      <div>
        <div className="section-title">Payment Overview</div>
        <div className="pay-kpi-row">
          {[
            { label: 'Total Revenue (Month)', value: formatCurrency(kpi.totalRev), sub: '+12.5% vs last week', iconClass: 'green' },
            { label: 'Successful Payments', value: String(kpi.successfulCount), sub: 'Completed', iconClass: 'green' },
            { label: 'Failed / Declined', value: String(kpi.failedCount), sub: 'Needs review', iconClass: 'red' },
            { label: 'Pending', value: String(kpi.pendingCount), sub: 'Awaiting confirmation', iconClass: 'amber' },
            { label: 'Driver Payouts', value: formatCurrency(kpi.driverPayouts), sub: 'This period', iconClass: 'blue' },
            { label: 'Stripe Balance', value: formatCurrency(kpi.stripeBalance), sub: 'Available for payout', iconClass: 'purple' },
          ].map((card, idx) => (
            <div key={idx} className="pay-kpi">
              <div className="kpi-top">
                <div className={`kpi-icon ${card.iconClass}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {idx === 0 && <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>}
                    {idx === 1 && <><polyline points="20 6 9 17 4 12"/></>}
                    {idx === 2 && <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                    {idx === 3 && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                    {idx === 4 && <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></>}
                    {idx === 5 && <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>}
                  </svg>
                </div>
              </div>
              <div className="kpi-label">{card.label}</div>
              <div className="kpi-value">{card.value}</div>
              <div className="kpi-sub neutral">{card.sub}</div>
            </div>
          ))}
        </div>
        {error && <div className="mt-3 text-[13px] text-red-500">{error}</div>}
      </div>

      {/* ── REVENUE BY SERVICE ── */}
      <div>
        <div className="section-title">Revenue by Service</div>
        <div className="pay-revenue-grid">
          {(data?.revenueByService || []).length === 0 && !loading ? (
            <div className="text-[13px] text-fg-muted">No revenue records found in the database.</div>
          ) : (data?.revenueByService || []).map((svc, idx) => (
            <div key={idx} className="rev-card">
              <div className="rev-amount">{formatCurrency(svc.amount)}</div>
              <div className="rev-label">{svc.package_name}</div>
              <div className={`rev-pct ${idx % 2 === 0 ? 'accent' : ''}`}>{svc.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN PANELS ── */}
      <div className="pay-panels">
        {/* Left: Transactions Table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Transactions</span>
            <div className="table-actions">
              <div className="filter-tabs">
                {filters.map(f => (
                  <button
                    key={f}
                    className={`filter-tab ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Transaction ID</th><th>Customer</th><th>Package</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-fg-muted">Loading payments from database...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-fg-muted">{d.noResults || 'No payments found in the database'}</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-surface-hover transition-colors cursor-pointer" onClick={() => setSelectedId(p.id)}>
                    <td className="font-mono text-fg-muted">{p.id}</td>
                    <td><span style={{ fontWeight: 500 }}>{p.guest}</span></td>
                    <td>{p.service}</td>
                    <td className="font-mono font-semibold">{formatCurrency(p.amount)}</td>
                    <td>{p.method}</td>
                    <td><span className={statusBadges[p.status]}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                    <td className="text-fg-muted">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stripe Overview */}
          <div className="stripe-card">
            <div className="stripe-title">Stripe Gateway</div>
            <div className="stripe-balance">{formatCurrency(kpi.stripeBalance)}</div>
            <div className="stripe-sub">Connected · Live mode</div>
            <div className="stripe-detail"><span className="label">Total processed</span><span className="value">{formatCurrency(kpi.totalRev)}</span></div>
            <div className="stripe-detail"><span className="label">Pending settlement</span><span className="value">{formatCurrency(kpi.pending)}</span></div>
            <div className="stripe-detail"><span className="label">Last payout</span><span className="value">{formatCurrency(data?.summary?.lastPayout || 0)}</span></div>
            <div className="stripe-detail"><span className="label">Processing fee rate</span><span className="value">{(stripeFee.percent * 100).toFixed(1)}% + ${stripeFee.fixed.toFixed(2)}</span></div>
          </div>

          {/* Payment Summary */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Payment Summary</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              <div className="pay-summary">
                <div className="pay-summary-row">
                  <span className="label">Total Revenue</span>
                  <span className="value">{formatCurrency(kpi.totalRev)}</span>
                </div>
                <div className="pay-summary-row">
                  <span className="label">Stripe Fees</span>
                  <span className="value" style={{ color: 'var(--danger)' }}>-{formatCurrency(kpi.totalFees)}</span>
                </div>
                <div className="pay-summary-row">
                  <span className="label">Refunds</span>
                  <span className="value" style={{ color: 'var(--warning)' }}>-{formatCurrency(kpi.refunds)}</span>
                </div>
                <div className="summary-total">
                  <span className="label">Net Revenue</span>
                  <span className="value">{formatCurrency(kpi.totalNet)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payouts */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Payouts</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {payouts.length === 0 && !loading ? (
                <div className="text-[13px] text-fg-muted py-4">No driver payouts found in the database.</div>
              ) : payouts.map((po, idx) => (
                <div key={idx} className="payout-item">
                  <div className="payout-avatar" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{po.init}</div>
                  <div className="payout-info">
                    <div className="payout-name">{po.driver}</div>
                    <div className="payout-meta">{po.date}</div>
                  </div>
                  <div className="payout-amount">{formatCurrency(po.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PAYMENT DETAIL MODAL ── */}
      {selected && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6" onClick={() => setSelectedId(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-[520px] rounded-[14px] overflow-hidden modal-wide"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>Payment #{selected.id}</h3>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-[4px] transition-all" style={{ color: 'var(--fg-muted)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Guest</label><div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selected.guest}</div></div>
                <div><label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Service</label><div className="text-[13px]" style={{ color: 'var(--fg)' }}>{selected.service}</div></div>
                <div><label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Amount</label><div className="text-[13px] font-semibold font-mono">{formatCurrency(selected.amount)}</div></div>
                <div><label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Status</label><span className={statusBadges[selected.status]}>{selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}</span></div>
                <div><label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Fee</label><div className="text-[13px] font-mono">{formatCurrency(selected.fee)}</div></div>
                <div><label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Net</label><div className="text-[13px] font-semibold font-mono">{formatCurrency(selected.net)}</div></div>
                <div><label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Payment Method</label><div className="text-[13px]">{selected.method}</div></div>
                <div><label className="block text-[11px] uppercase tracking-[0.4px]" style={{ color: 'var(--fg-muted)' }}>Date</label><div className="text-[13px]">{selected.date}</div></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setSelectedId(null); showToast('Receipt sent') }} className="btn btn-primary w-full">{d.sendReceipt || 'Send Receipt'}</button>
                <button onClick={() => setSelectedId(null)} className="btn btn-secondary">{d.close || 'Close'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
