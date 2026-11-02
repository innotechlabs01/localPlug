'use client'

import { useEffect, useState, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/lib/admin/toast-context'

interface ApiTransaction {
  booking_reference: string
  package_name: string
  amount: number
  currency: string
  status: 'completed' | 'pending' | 'refunded' | 'failed'
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
    platformBalance: number
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

const filters = ['all', 'completed', 'pending', 'refunded', 'failed'] as const

export default function PaymentsPage() {
  const { t } = useI18n()
  const d = (t.admin as any).payments ?? {}
  const [filter, setFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [data, setData] = useState<PaymentsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [platformFee, setPlatformFee] = useState({ percent: 0.10, fixed: 0.30 })

  const { showToast } = useToast()

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
    return () => { mounted = false }
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

  const filtered = useMemo(() => {
    const payments = (data?.transactions || []).map((payment) => ({
      id: payment.booking_reference,
      guest: payment.customer_name || payment.customer_email || 'Unknown customer',
      service: payment.package_name || 'Unassigned package',
      amount: payment.amount,
      date: payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-US') : '',
      status: payment.status,
      method: 'Polar',
      email: payment.customer_email,
      phone: payment.customer_phone,
      errorMessage: payment.error_message,
    }))
    if (filter === 'all') return payments
    return payments.filter(p => p.status === filter)
  }, [data?.transactions, filter])

  const payments = useMemo(() => (data?.transactions || []).map((payment) => ({
    id: payment.booking_reference,
    guest: payment.customer_name || payment.customer_email || 'Unknown customer',
    service: payment.package_name || 'Unassigned package',
    amount: payment.amount,
    date: payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-US') : '',
    status: payment.status,
    method: 'Polar',
    email: payment.customer_email,
    phone: payment.customer_phone,
    errorMessage: payment.error_message,
  })), [data?.transactions])

  const kpi = useMemo(() => {
    const apiKpis = data?.kpis
    const summary = data?.summary
    const totalRev = apiKpis?.totalRevenue ?? payments.reduce((s, p) => s + p.amount, 0)
    const completed = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
    const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
    const refunds = summary?.refundsTotal ?? payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0)
    const successfulCount = apiKpis?.successfulCount ?? payments.filter(p => p.status === 'completed').length
    const failedCount = apiKpis?.failedCount ?? payments.filter(p => p.status === 'failed').length
    const pendingCount = apiKpis?.pendingCount ?? payments.filter(p => p.status === 'pending').length
    const driverPayouts = apiKpis?.driverPayouts ?? 0
    const platformBalance = apiKpis?.platformBalance ?? totalRev - refunds
    return { totalRev, completed, pending, refunds, successfulCount, failedCount, pendingCount, driverPayouts, platformBalance }
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

  const statusLabel: Record<string, string> = {
    completed: 'Completado',
    pending: 'Pendiente',
    refunded: 'Reembolsado',
    failed: 'Fallido',
  }

  return (
    <div className="admin-page space-y-6">
      {/* KPI ROW */}
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Pagos</h1>
          <p className="admin-section-desc">Supervisa transacciones, pagos a conductores y el balance de la plataforma.</p>
        </div>
      </section>
      <div className="admin-grid-6 admin-mb-4">
        {[
          { label: 'Ingresos Totales', value: formatCurrency(kpi.totalRev), sub: 'Todo el mes', icon: 'green' },
          { label: 'Pagos Exitosos', value: String(kpi.successfulCount), sub: 'Completados', icon: 'green' },
          { label: 'Fallidos', value: String(kpi.failedCount), sub: 'Requieren revisión', icon: 'red' },
          { label: 'Pendientes', value: String(kpi.pendingCount), sub: 'A confirmación', icon: 'amber' },
          { label: 'Pagos a Conductores', value: formatCurrency(kpi.driverPayouts), sub: 'Este período', icon: 'blue' },
          { label: 'Balance Plataforma', value: formatCurrency(kpi.platformBalance), sub: 'Disponible para pagar', icon: 'purple' },
        ].map((card, idx) => (
          <div key={idx} className="admin-kpi-card">
            <div className="admin-kpi-top">
              <div className={`admin-kpi-icon ${card.icon}`}>
                {idx === 0 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
                {idx === 1 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                {idx === 2 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
                {idx === 3 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                {idx === 4 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>}
                {idx === 5 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
              </div>
            </div>
            <div className="admin-kpi-label">{card.label}</div>
            <div className="admin-kpi-value">{card.value}</div>
            <div className="admin-kpi-sub neutral">{card.sub}</div>
          </div>
        ))}
        {error && <div style={{ gridColumn: '1 / -1', color: 'var(--ui-danger)', fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>

      {/* Revenue by Service */}
      <section className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Ingresos por Servicio</h2>
        </div>
        <div className="admin-card-body">
          {(data?.revenueByService || []).length === 0 && !loading ? (
            <div className="admin-empty" style={{ padding: '24px 24px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>No hay registros de ingresos</h3>
            </div>
          ) : (
            <div className="admin-grid-responsive">
              {(data?.revenueByService || []).map((svc, idx) => (
                <div key={idx} className="admin-card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ui-fg)', fontFamily: 'var(--ui-font-mono)' }}>{formatCurrency(svc.amount)}</div>
                  <div style={{ fontSize: 13, color: 'var(--ui-fg-muted)', marginTop: 4 }}>{svc.package_name}</div>
                  <span className="admin-badge accent" style={{ marginTop: 8, display: 'inline-flex' }}>{svc.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main panels */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <h2 className="admin-card-title">Transacciones</h2>
          <div className="admin-tabs">
            {filters.map(f => (
              <button
                key={f}
                className={`admin-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID Transacción</th>
                  <th>Cliente</th>
                  <th>Paquete</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ui-fg-muted)' }}>
                      Cargando pagos desde la base de datos...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ui-fg-muted)' }}>
                      {d.noResults || 'No se encontraron pagos'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.id} onClick={() => setSelectedId(p.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 12, color: 'var(--ui-fg-muted)' }}>{p.id}</td>
                      <td style={{ fontWeight: 600 }}>{p.guest}</td>
                      <td>{p.service}</td>
                      <td style={{ fontFamily: 'var(--ui-font-mono)', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                      <td>{p.method}</td>
                      <td>
                        <span className={`admin-badge ${p.status === 'completed' ? 'accent' : p.status === 'failed' ? 'danger' : p.status === 'refunded' ? 'warning' : 'neutral'}`}>
                          {statusLabel[p.status]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--ui-fg-muted)', fontSize: 12 }}>{p.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Right side: gateway + summary + payouts (as stacked sections below on mobile, grid on desktop) */}
      <section className="admin-grid-3 admin-mt-4">
        {/* Polar Gateway */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Polar Gateway</h2>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--ui-font-mono)', color: 'var(--ui-fg)' }}>{formatCurrency(kpi.platformBalance)}</div>
            <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>Conectado · Modo en vivo</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ui-fg-muted)', borderBottom: '1px solid var(--ui-border-light)', paddingBottom: 6 }}>
              <span>Procesado Total</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(kpi.totalRev)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ui-fg-muted)', borderBottom: '1px solid var(--ui-border-light)', padding: '6px 0' }}>
              <span>Pendiente de liquidación</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(kpi.pending)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ui-fg-muted)', borderBottom: '1px solid var(--ui-border-light)', padding: '6px 0' }}>
              <span>Último Pago</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(data?.summary?.lastPayout || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ui-fg-muted)' }}>
              <span>Tarifa de procesamiento</span>
              <span style={{ fontWeight: 600 }}>{(platformFee.percent * 100).toFixed(1)}% + ${platformFee.fixed.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Resumen de Pago</h2>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ui-fg-muted)' }}>Ingresos Totales</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(kpi.totalRev)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ui-fg-muted)' }}>Tarifas Plataforma</span>
              <span style={{ color: 'var(--ui-danger)', fontWeight: 600 }}>-{formatCurrency(kpi.totalRev * platformFee.percent)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ui-fg-muted)' }}>Reembolsos</span>
              <span style={{ color: 'var(--ui-warning)', fontWeight: 600 }}>-{formatCurrency(kpi.refunds)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, borderTop: '1px solid var(--ui-border-light)', paddingTop: 8, marginTop: 8 }}>
              <span>Ingreso Neto</span>
              <span>{formatCurrency(kpi.totalRev - kpi.refunds - kpi.totalRev * platformFee.percent)}</span>
            </div>
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Pagos Recientes a Conductores</h2>
          </div>
          <div className="admin-card-body">
            {payouts.length === 0 && !loading ? (
              <div style={{ color: 'var(--ui-fg-muted)', fontSize: 13, padding: 12 }}>No hay pagos a conductores registrados.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {payouts.map((po, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'var(--ui-surface)', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--ui-accent-soft)', color: 'var(--ui-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>{po.init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)' }}>{po.driver}</div>
                      <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{po.date}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--ui-font-mono)' }}>{formatCurrency(po.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Payment Detail Modal */}
      {selected && (
        <div className="admin-modal-overlay open" onClick={() => setSelectedId(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Pago #{selected.id}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSelectedId(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-grid-2">
                <div className="admin-field">
                  <label className="admin-field-label">Cliente</label>
                  <div style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{selected.guest}</div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Paquete</label>
                  <div style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{selected.service}</div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Monto</label>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--ui-font-mono)' }}>{formatCurrency(selected.amount)}</div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Estado</label>
                  <span className={`admin-badge ${selected.status === 'completed' ? 'accent' : selected.status === 'failed' ? 'danger' : 'neutral'}`}>
                    {statusLabel[selected.status]}
                  </span>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Tarifa</label>
                  <div style={{ fontSize: 13, fontFamily: 'var(--ui-font-mono)' }}>{formatCurrency(selected.amount * platformFee.percent)}</div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Neto</label>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--ui-font-mono)' }}>{formatCurrency(selected.amount - selected.amount * platformFee.percent)}</div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Método</label>
                  <div style={{ fontSize: 13 }}>{selected.method}</div>
                </div>
                <div className="admin-field">
                  <label className="admin-field-label">Fecha</label>
                  <div style={{ fontSize: 13 }}>{selected.date}</div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button onClick={() => { setSelectedId(null); showToast('Recibo enviado') }} className="admin-btn admin-btn-secondary admin-btn-sm">Enviar Recibo</button>
                <button onClick={() => setSelectedId(null)} className="admin-btn admin-btn-primary admin-btn-sm">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
