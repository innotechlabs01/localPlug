'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEventStream } from '@/lib/use-event-stream'
import { useToast } from '@/lib/admin/toast-context'

interface Category {
  id: number; name: string; trip_fare_usd: number; is_active: number; sort_order: number; driver_count?: number
}
interface PayoutRequest {
  id: number; payee_type: string; payee_id: number; payee_name: string | null
  period: string; amount_usd: number; status: string; reviewed_by: string | null
  paid_at: string | null; method: string | null; reference: string | null; created_at: string
}
interface Refund {
  id: number; booking_reference: string; type: string; amount_usd: number; status: string
  resolution: string | null; reason: string | null; created_at: string
}

const money = (v: number) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })

export default function SettlementsPage() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [requests, setRequests] = useState<PayoutRequest[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [refundTotals, setRefundTotals] = useState<Array<{ resolution: string; count: number; total: number }>>([])
  const [busy, setBusy] = useState(false)

  const [ncName, setNcName] = useState('')
  const [ncFare, setNcFare] = useState('')

  const loadAll = useCallback(async () => {
    const [c, r, rf] = await Promise.all([
      fetch('/api/admin/vehicle-categories').then(x => x.json().catch(() => ({}))),
      fetch('/api/admin/payouts').then(x => x.json().catch(() => ({}))),
      fetch('/api/admin/refunds').then(x => x.json().catch(() => ({}))),
    ])
    setCategories(c.categories || [])
    setRequests(r.requests || [])
    setRefunds(rf.refunds || [])
    setRefundTotals(rf.totals || [])
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEventStream({
    'payout.requested': () => { loadAll() },
    'payout.settled': () => { loadAll() },
  }, { pollMs: 8000 })

  const addCategory = async () => {
    const fare = Number(ncFare)
    if (!ncName.trim() || !Number.isFinite(fare) || fare < 0) return showToast('Nombre y tarifa válida requeridos')
    setBusy(true)
    const res = await fetch('/api/admin/vehicle-categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ncName.trim(), trip_fare_usd: fare }),
    })
    setBusy(false)
    if (!res.ok) return showToast('No se pudo crear la categoría')
    setNcName(''); setNcFare('')
    showToast('Categoría creada')
    loadAll()
  }

  const updateCategory = async (cat: Category) => {
    const fare = Number(cat.trip_fare_usd)
    if (!Number.isFinite(fare) || fare < 0) return showToast('Tarifa inválida')
    await fetch(`/api/admin/vehicle-categories/${cat.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cat.name, trip_fare_usd: fare, is_active: cat.is_active }),
    })
    showToast('Categoría actualizada')
  }

  const settle = async (id: number, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const reference = String(fd.get('reference') || '')
    if (!reference.trim()) return showToast('Referencia de transferencia requerida')
    setBusy(true)
    const res = await fetch(`/api/admin/payouts/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'settle', reference: reference.trim(), method: 'bank_transfer' }),
    })
    setBusy(false)
    if (!res.ok) return showToast('No se pudo liquidar')
    showToast('Liquidación confirmada')
    loadAll()
  }

  const cancel = async (id: number) => {
    setBusy(true)
    await fetch(`/api/admin/payouts/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    setBusy(false)
    showToast('Solicitud cancelada')
    loadAll()
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Liquidaciones y Tarifas</h1>
          <p className="admin-section-desc">Tarifas de carrera por categoría, liquidaciones a conductores y hoteles, y reembolsos.</p>
        </div>
      </section>

      {/* Vehicle categories */}
      <section className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Tarifas por categoría de vehículo</h2>
        </div>
        <div className="admin-card-body">
          <div className="admin-flex-between admin-mb-4" style={{ flexWrap: 'wrap' }}>
            <div className="admin-field" style={{ minWidth: 200 }}>
              <label className="admin-field-label">Categoría (Ej: SUV)</label>
              <input
                className="admin-input"
                value={ncName}
                onChange={e => setNcName(e.target.value)}
              />
            </div>
            <div className="admin-field" style={{ minWidth: 160 }}>
              <label className="admin-field-label">Tarifa por carrera (USD)</label>
              <input
                className="admin-input"
                type="number"
                min="0"
                step="0.01"
                value={ncFare}
                onChange={e => setNcFare(e.target.value)}
              />
            </div>
            <button onClick={addCategory} disabled={busy} className="admin-btn admin-btn-primary admin-btn-sm">
              {busy ? 'Guardando...' : 'Agregar categoría'}
            </button>
          </div>
          {categories.length === 0 ? (
            <div className="admin-empty" style={{ padding: '24px 24px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>Aún no hay categorías</h3>
              <p>Agrega una para asignar tarifa a los conductores.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Tarifa / carrera</th>
                    <th>Conductores</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>
                        <input
                          className="admin-input admin-input-sm"
                          value={cat.name}
                          onChange={e => setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-input admin-input-sm"
                          type="number"
                          min="0"
                          step="0.01"
                          value={cat.trip_fare_usd}
                          onChange={e => setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, trip_fare_usd: Number(e.target.value) } : c))}
                        />
                      </td>
                      <td style={{ color: 'var(--ui-fg-secondary)', fontSize: 13 }}>{cat.driver_count ?? 0}</td>
                      <td>
                        <button
                          onClick={() => { const c = { ...cat, is_active: cat.is_active ? 0 : 1 }; setCategories(cats => cats.map(x => x.id === cat.id ? c : x)); updateCategory(c) }}
                          className={`admin-btn admin-btn-ghost admin-btn-sm ${cat.is_active ? 'admin-btn-secondary' : ''}`}
                        >
                          {cat.is_active ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => updateCategory(cat)} className="admin-btn admin-btn-secondary admin-btn-sm">Guardar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Payout requests */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Solicitudes de pago</h2>
        </div>
        <div className="admin-card-body">
          {requests.length === 0 ? (
            <div className="admin-empty" style={{ padding: '24px 24px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>Sin solicitudes pendientes</h3>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Beneficiario</th>
                    <th>Tipo</th>
                    <th>Periodo</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(rq => (
                    <tr key={rq.id}>
                      <td style={{ fontWeight: 600 }}>{rq.payee_name || ('#' + rq.payee_id)}</td>
                      <td>{rq.payee_type}</td>
                      <td style={{ color: 'var(--ui-fg-muted)' }}>{rq.period}</td>
                      <td style={{ fontWeight: 600 }}>{money(rq.amount_usd)}</td>
                      <td>
                        <span className={`admin-badge ${rq.status === 'paid' ? 'accent' : rq.status === 'requested' ? 'warning' : 'neutral'}`}>
                          {rq.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {rq.status === 'requested' && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <form onSubmit={(e) => settle(rq.id, e)} style={{ display: 'flex', gap: 6 }}>
                              <input name="reference" placeholder="Ref transferencia" className="admin-input admin-input-sm" style={{ width: 150 }} />
                              <button type="submit" disabled={busy} className="admin-btn admin-btn-secondary admin-btn-sm">Liquidar</button>
                            </form>
                            <button onClick={() => cancel(rq.id)} className="admin-btn admin-btn-danger admin-btn-sm">Cancelar</button>
                          </div>
                        )}
                        {rq.status === 'paid' && (
                          <span style={{ color: 'var(--ui-fg-muted)', fontSize: 12 }}>{rq.paid_at} · {rq.method}{rq.reference ? ' · ' + rq.reference : ''}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Refunds */}
      <section className="admin-card admin-mt-4">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Reembolsos / Disputas</h2>
        </div>
        <div className="admin-card-body">
          {refundTotals.length > 0 && (
            <div className="admin-flex-between admin-mb-4" style={{ flexWrap: 'wrap' }}>
              {refundTotals.map(rt => (
                <div key={rt.resolution} className="admin-card" style={{ padding: '10px 16px', minWidth: 150 }}>
                  <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)', textTransform: 'capitalize' }}>{rt.resolution === 'pre_milestone' ? 'Pre-milestone' : rt.resolution}</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{money(rt.total)} <span style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>({rt.count})</span></div>
                </div>
              ))}
            </div>
          )}
          {refunds.length === 0 ? (
            <div className="admin-empty" style={{ padding: '16px 24px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>Sin reembolsos registrados</h3>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Resolución</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(rf => (
                    <tr key={rf.id}>
                      <td style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 12 }}>{rf.booking_reference}</td>
                      <td>{rf.type}</td>
                      <td style={{ fontWeight: 600 }}>{money(rf.amount_usd)}</td>
                      <td>
                        <span className={`admin-badge ${rf.resolution === 'write_off' ? 'danger' : 'accent'}`}>
                          {rf.resolution || rf.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--ui-fg-muted)', fontSize: 12 }}>{rf.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
