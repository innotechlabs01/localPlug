'use client'

import { useState, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'

interface Payment {
  id: number; guest: string; service: string; amount: number; fee: number; net: number
  date: string; status: 'completed' | 'pending' | 'refunded' | 'failed'; method: string
}

const payments: Payment[] = [
  { id: 1001, guest: 'Sofía Martínez', service: 'Airport Transfer', amount: 85, fee: 3.40, net: 81.60, date: '2026-05-23', status: 'completed', method: 'Stripe' },
  { id: 1002, guest: 'James Rodriguez', service: 'VIP Tour', amount: 350, fee: 10.50, net: 339.50, date: '2026-05-23', status: 'completed', method: 'Stripe' },
  { id: 1003, guest: 'Ana López', service: 'Airport Transfer', amount: 85, fee: 3.40, net: 81.60, date: '2026-05-22', status: 'pending', method: 'Cash' },
  { id: 1004, guest: 'Carlos Gómez', service: 'Hotel Shuttle', amount: 45, fee: 0, net: 45, date: '2026-05-22', status: 'completed', method: 'Cash' },
  { id: 1005, guest: 'Emma Wilson', service: 'City Tour', amount: 120, fee: 4.80, net: 115.20, date: '2026-05-21', status: 'completed', method: 'Stripe' },
  { id: 1006, guest: 'Pierre Dubois', service: 'VIP Tour', amount: 350, fee: 10.50, net: 339.50, date: '2026-05-21', status: 'refunded', method: 'Stripe' },
  { id: 1007, guest: 'Lucía Silva', service: 'Airport Transfer', amount: 85, fee: 3.40, net: 81.60, date: '2026-05-20', status: 'completed', method: 'Stripe' },
  { id: 1008, guest: 'Hiroshi Tanaka', service: 'Hotel Shuttle', amount: 45, fee: 0, net: 45, date: '2026-05-20', status: 'failed', method: 'Cash' },
  { id: 1009, guest: 'Maria Becker', service: 'VIP Tour', amount: 350, fee: 10.50, net: 339.50, date: '2026-05-19', status: 'completed', method: 'Stripe' },
  { id: 1010, guest: 'Rafael Oliveira', service: 'City Tour', amount: 120, fee: 4.80, net: 115.20, date: '2026-05-19', status: 'pending', method: 'Cash' },
]

const payouts = [
  { driver: 'Carlos M.', amount: 1280, date: 'May 23', init: 'CM' },
  { driver: 'María G.', amount: 940, date: 'May 22', init: 'MG' },
  { driver: 'Felipe L.', amount: 2100, date: 'May 22', init: 'FL' },
  { driver: 'Diego P.', amount: 760, date: 'May 21', init: 'DP' },
]

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
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return payments
    return payments.filter(p => p.status === filter)
  }, [filter])

  const kpi = useMemo(() => {
    const totalRev = payments.reduce((s, p) => s + p.amount, 0)
    const totalFees = payments.reduce((s, p) => s + p.fee, 0)
    const totalNet = payments.reduce((s, p) => s + p.net, 0)
    const completed = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
    const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
    const refunds = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0)
    return { totalRev, totalFees, totalNet, completed, pending, refunds }
  }, [])

  const selected = useMemo(() => payments.find(p => p.id === selectedId), [selectedId])

  return (
    <div className="pay-page">
      {/* ── KPI ROW ── */}
      <div>
        <div className="section-title">Payment Overview</div>
        <div className="pay-kpi-row">
          {[
            { label: 'Total Revenue', value: kpi.totalRev, sub: '+12.5% vs last week', iconClass: 'green' },
            { label: 'Pending', value: kpi.pending, sub: 'Awaiting confirmation', iconClass: 'amber' },
            { label: 'Completed', value: kpi.completed, sub: 'Settled', iconClass: 'blue' },
            { label: 'Refunds', value: kpi.refunds, sub: '3 this month', iconClass: 'red' },
            { label: 'Fees', value: kpi.totalFees, sub: '2.9% + $0.30 per tx', iconClass: 'teal' },
            { label: 'Net Revenue', value: kpi.totalNet, sub: 'After fees', iconClass: 'gold' },
          ].map((card, idx) => (
            <div key={idx} className="pay-kpi">
              <div className="kpi-top">
                <div className={`kpi-icon ${card.iconClass}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {idx === 0 && <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>}
                    {idx === 1 && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                    {idx === 2 && <><polyline points="20 6 9 17 4 12"/></>}
                    {idx === 3 && <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                    {idx === 4 && <><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}
                    {idx === 5 && <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}
                  </svg>
                </div>
              </div>
              <div className="kpi-label">{card.label}</div>
              <div className="kpi-value">{formatCurrency(card.value)}</div>
              <div className="kpi-sub neutral">{card.sub}</div>
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
                <tr><th>ID</th><th>Guest</th><th>Service</th><th>Amount</th><th>Fee</th><th>Net</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-fg-muted">{d.noResults || 'No payments found'}</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-surface-hover transition-colors cursor-pointer" onClick={() => setSelectedId(p.id)}>
                    <td className="font-mono text-fg-muted">#{p.id}</td>
                    <td><span style={{ fontWeight: 500 }}>{p.guest}</span></td>
                    <td>{p.service}</td>
                    <td className="font-mono font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="font-mono text-fg-muted">{formatCurrency(p.fee)}</td>
                    <td className="font-mono font-semibold">{formatCurrency(p.net)}</td>
                    <td><span className={statusBadges[p.status]}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                    <td className="text-fg-muted">{p.date}</td>
                    <td>
                      <div className="table-actions" style={{ gap: 2 }}>
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); showToast(`View details for ${p.guest}`) }} title="View">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); showToast(`Receipt for ${p.guest}`) }} title="Receipt">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
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
            <div className="stripe-header">
              <div className="stripe-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--info)' }}>
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <div>
                <div className="stripe-title">Stripe Gateway</div>
                <div className="stripe-sub">Connected · Live mode</div>
              </div>
            </div>
            <div className="stripe-detail"><span className="label">Total processed</span><span className="value">{formatCurrency(kpi.totalRev)}</span></div>
            <div className="stripe-detail"><span className="label">Pending settlement</span><span className="value">{formatCurrency(kpi.pending)}</span></div>
            <div className="stripe-detail"><span className="label">Next payout</span><span className="value">May 25, 2026</span></div>
            <div className="stripe-detail"><span className="label">Processing fee rate</span><span className="value">2.9% + $0.30</span></div>
          </div>

          {/* Recent Payouts */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Payouts</span>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {payouts.map((po, idx) => (
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[2000] px-4 py-3 rounded-[8px] text-[13px] font-medium shadow-lg"
          style={{ background: 'var(--accent)', color: 'white' }}>
          {toast}
        </div>
      )}
    </div>
  )
}