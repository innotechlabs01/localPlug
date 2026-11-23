'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEventStream } from '@/lib/use-event-stream'

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
  const [categories, setCategories] = useState<Category[]>([])
  const [requests, setRequests] = useState<PayoutRequest[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [refundTotals, setRefundTotals] = useState<Array<{ resolution: string; count: number; total: number }>>([])
  const [toast, setToast] = useState<{ message: string; type: 'ok' | 'err' } | null>(null)
  const [busy, setBusy] = useState(false)

  // New category form
  const [ncName, setNcName] = useState('')
  const [ncFare, setNcFare] = useState('')

  const notify = (message: string, type: 'ok' | 'err' = 'ok') => setToast({ message, type })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

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

  // Realtime push — a new payout request or a settlement refreshes the board.
  useEventStream({
    'payout.requested': () => { loadAll() },
    'payout.settled': () => { loadAll() },
  }, { pollMs: 8000 })

  const addCategory = async () => {
    const fare = Number(ncFare)
    if (!ncName.trim() || !Number.isFinite(fare) || fare < 0) return notify('Nombre y tarifa válida requeridos', 'err')
    setBusy(true)
    const res = await fetch('/api/admin/vehicle-categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ncName.trim(), trip_fare_usd: fare }),
    })
    setBusy(false)
    if (!res.ok) return notify('No se pudo crear la categoría', 'err')
    setNcName(''); setNcFare('')
    notify('Categoría creada')
    loadAll()
  }

  const updateCategory = async (cat: Category) => {
    const fare = Number(cat.trip_fare_usd)
    if (!Number.isFinite(fare) || fare < 0) return notify('Tarifa inválida', 'err')
    await fetch(`/api/admin/vehicle-categories/${cat.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cat.name, trip_fare_usd: fare, is_active: cat.is_active }),
    })
    notify('Categoría actualizada')
  }

  const settle = async (id: number, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const reference = String(fd.get('reference') || '')
    if (!reference.trim()) return notify('Referencia de transferencia requerida', 'err')
    setBusy(true)
    const res = await fetch(`/api/admin/payouts/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'settle', reference: reference.trim(), method: 'bank_transfer' }),
    })
    setBusy(false)
    if (!res.ok) return notify('No se pudo liquidar', 'err')
    notify('Liquidación confirmada')
    loadAll()
  }

  const cancel = async (id: number) => {
    setBusy(true)
    await fetch(`/api/admin/payouts/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    setBusy(false)
    notify('Solicitud cancelada')
    loadAll()
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, padding: '14px 22px', borderRadius: 12, zIndex: 1000,
          background: toast.type === 'ok' ? 'var(--accent)' : 'var(--danger)', color: '#fff', fontWeight: 500,
        }}>{toast.message}</div>
      )}

      <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        Liquidaciones y Tarifas
      </h1>
      <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
        Tarifas de carrera por categoría, liquidaciones a conductores y hoteles, y reembolsos.
      </p>

      {/* ── Vehicle categories / tariff table ── */}
      <section style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 20, marginBottom: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Tarifas por categoría de vehículo</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={ncName} onChange={e => setNcName(e.target.value)} placeholder="Categoría (Ej: SUV)" style={sInput} />
          <input value={ncFare} onChange={e => setNcFare(e.target.value)} placeholder="Tarifa por carrera (USD)" type="number" min="0" step="0.01" style={{ ...sInput, width: 180 }} />
          <button onClick={addCategory} disabled={busy} style={sBtn}>{busy ? 'Guardando...' : 'Agregar categoría'}</button>
        </div>
        {categories.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Aún no hay categorías. Agrega una para asignar tarifa a los conductores.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                <th style={{ padding: '8px 10px' }}>Categoría</th>
                <th style={{ padding: '8px 10px' }}>Tarifa / carrera</th>
                <th style={{ padding: '8px 10px' }}>Conductores</th>
                <th style={{ padding: '8px 10px' }}>Estado</th>
                <th style={{ padding: '8px 10px' }}></th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <input value={cat.name} onChange={e => setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))} style={{ ...sInput, width: 160 }} />
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <input value={cat.trip_fare_usd} type="number" min="0" step="0.01" onChange={e => setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, trip_fare_usd: Number(e.target.value) } : c))} style={{ ...sInput, width: 130 }} />
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontSize: 13 }}>{cat.driver_count ?? 0}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button onClick={() => { const c = { ...cat, is_active: cat.is_active ? 0 : 1 }; setCategories(cats => cats.map(x => x.id === cat.id ? c : x)); updateCategory(c) }} style={{ ...sToggle, background: cat.is_active ? 'var(--accent-gold)' : 'var(--surface)' }}>
                      {cat.is_active ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td style={{ padding: '8px 10px' }}><button onClick={() => updateCategory(cat)} style={sBtn}>Guardar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Payout requests ── */}
      <section style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 20, marginBottom: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Solicitudes de pago</h2>
        {requests.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Sin solicitudes pendientes.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                <th style={{ padding: '8px 10px' }}>Beneficiario</th>
                <th style={{ padding: '8px 10px' }}>Tipo</th>
                <th style={{ padding: '8px 10px' }}>Periodo</th>
                <th style={{ padding: '8px 10px' }}>Monto</th>
                <th style={{ padding: '8px 10px' }}>Estado</th>
                <th style={{ padding: '8px 10px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(rq => (
                <tr key={rq.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 500 }}>{rq.payee_name || ('#' + rq.payee_id)}</td>
                  <td style={{ padding: '8px 10px' }}>{rq.payee_type}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{rq.period}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{money(rq.amount_usd)}</td>
                  <td style={{ padding: '8px 10px' }}><span style={{ ...sBadge, ...(rq.status === 'paid' ? { color: '#4ade80' } : rq.status === 'requested' ? { color: '#facc15' } : { color: 'var(--text-muted)' }) }}>{rq.status}</span></td>
                  <td style={{ padding: '8px 10px' }}>
                    {rq.status === 'requested' && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <form onSubmit={(e) => settle(rq.id, e)} style={{ display: 'flex', gap: 6 }}>
                          <input name="reference" placeholder="Ref transferencia" style={{ ...sInput, width: 160 }} />
                          <button type="submit" disabled={busy} style={sBtn}>Liquidar</button>
                        </form>
                        <button onClick={() => cancel(rq.id)} style={sBtnDanger}>Cancelar</button>
                      </div>
                    )}
                    {rq.status === 'paid' && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{rq.paid_at} · {rq.method}{rq.reference ? ' · ' + rq.reference : ''}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Refunds / disputes ── */}
      <section style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Reembolsos / Disputas</h2>
        {refundTotals.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {refundTotals.map(rt => (
              <div key={rt.resolution} style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{rt.resolution === 'pre_milestone' ? 'Pre-milestone' : rt.resolution}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{money(rt.total)} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({rt.count})</span></div>
              </div>
            ))}
          </div>
        )}
        {refunds.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>Sin reembolsos registrados.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                <th style={{ padding: '8px 10px' }}>Booking</th><th style={{ padding: '8px 10px' }}>Tipo</th>
                <th style={{ padding: '8px 10px' }}>Monto</th><th style={{ padding: '8px 10px' }}>Resolución</th><th style={{ padding: '8px 10px' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map(rf => (
                <tr key={rf.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12 }}>{rf.booking_reference}</td>
                  <td style={{ padding: '8px 10px' }}>{rf.type}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{money(rf.amount_usd)}</td>
                  <td style={{ padding: '8px 10px' }}><span style={{ ...sBadge, color: rf.resolution === 'write_off' ? '#f87171' : '#4ade80' }}>{rf.resolution || rf.status}</span></td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 12 }}>{rf.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

const sInput: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
}
const sBtn: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
  background: 'var(--accent-gold)', color: 'var(--bg-dark)', fontSize: 13, fontWeight: 600,
}
const sBtnDanger: React.CSSProperties = {
  padding: '9px 14px', borderRadius: 9, border: '1px solid var(--border)', cursor: 'pointer',
  background: 'transparent', color: 'var(--danger)', fontSize: 13,
}
const sToggle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  color: 'var(--bg-dark)',
}
const sBadge: React.CSSProperties = {
  padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
  background: 'rgba(0,0,0,0.08)', display: 'inline-block',
}