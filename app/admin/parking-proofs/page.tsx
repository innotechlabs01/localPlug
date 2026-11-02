'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/lib/admin/toast-context'
import { useEventStream } from '@/lib/use-event-stream'

interface Proof {
  id: number
  order_number: string
  booking_reference: string
  customer_name: string
  package_name: string
  package_price: number
  currency: string
  arrival_date: string | null
  arrival_time: string | null
  destination_address: string | null
  airport_parking: number
  parking_proof_url: string | null
  parking_proof_status: string
  parking_proof_rejected_reason: string | null
  created_at: string
  driver_name: string | null
  driver_plate: string | null
}

type Tab = 'pending' | 'approved' | 'rejected'

export default function AdminParkingProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { showToast } = useToast()

  const fetchProofs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/parking-proofs?status=${tab}`)
      const data = await res.json()
      setProofs(data.proofs || [])
    } catch (err) {
      void err
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchProofs()
    const interval = setInterval(fetchProofs, 30000)
    return () => clearInterval(interval)
  }, [fetchProofs])

  // Realtime push — a driver just submitted a parking proof.
  useEventStream({
    'parking_proof.submitted': () => { fetchProofs() },
  }, { pollMs: 8000 })

  const review = async (id: number, status: 'approved' | 'rejected') => {
    setActionLoading(id)
    const body: { status: string; reason?: string } = { status }
    if (status === 'rejected') {
      body.reason = rejectReason
      if (!rejectReason) {
        setActionLoading(null)
        showToast('Debe ingresar un motivo.')
        return
      }
    }
    try {
      const res = await fetch(`/api/admin/parking-proofs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        await fetchProofs()
        setRejectId(null)
        setRejectReason('')
        showToast(`Prueba ${status === 'approved' ? 'aprobada' : 'rechazada'}.`)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const formatCurrency = (val: number, curr?: string) =>
    '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2 }) + (curr === 'COP' ? ' COP' : ' USD')

  const statusConfig: Record<string, { bg: string; fg: string; label: string }> = {
    approved: { bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)', label: 'Aprobada' },
    rejected: { bg: 'var(--ui-danger-soft)', fg: 'var(--ui-danger)', label: 'Rechazada' },
    pending: { bg: 'var(--ui-warning-soft)', fg: 'var(--ui-warning)', label: 'Pendiente' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ui-fg)' }}>
          Pruebas de parqueo
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ui-fg-secondary)' }}>Evidencias de estacionamiento de conductores</p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {(['pending', 'approved', 'rejected'] as Tab[]).map(t => {
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                background: active ? 'var(--ui-accent-gold)' : 'var(--ui-bg-card)',
                color: active ? 'var(--ui-bg)' : 'var(--ui-fg-secondary)',
                border: `1px solid ${active ? 'var(--ui-accent-gold)' : 'var(--ui-border)'}`,
                cursor: 'pointer',
              }}
            >
              {t === 'pending' ? 'Pendientes' : t === 'approved' ? 'Aprobadas' : 'Rechazadas'}
              <span style={{ marginLeft: 6, opacity: 0.6 }}>{proofs.filter(p => p.parking_proof_status === t).length}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ui-fg-secondary)' }}>Cargando…</div>
      ) : proofs.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ui-fg-secondary)' }}>No hay pruebas en este estado.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {proofs.map(p => {
            const st = statusConfig[p.parking_proof_status]
            return (
              <div key={p.id} style={{
                background: 'var(--ui-bg-card)', border: '1px solid var(--ui-border)',
                borderRadius: 14, padding: 16, boxShadow: 'var(--ui-shadow-card)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: st.bg,
                      color: st.fg,
                    }}>{st.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--ui-fg-secondary)' }}>#{p.order_number} · {p.booking_reference}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ui-fg-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 13, marginBottom: 12 }}>
                  <div><div style={{ fontSize: 11, color: 'var(--ui-fg-secondary)' }}>Cliente</div><div style={{ color: 'var(--ui-fg)' }}>{p.customer_name}</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--ui-fg-secondary)' }}>Paquete</div><div style={{ color: 'var(--ui-fg)' }}>{p.package_name}</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--ui-fg-secondary)' }}>Total</div><div style={{ color: 'var(--ui-fg)' }}>{formatCurrency(p.package_price, p.currency)}</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--ui-fg-secondary)' }}>Conductor</div><div style={{ color: 'var(--ui-fg)' }}>{p.driver_name || '—'}</div></div>
                </div>

                {p.parking_proof_url && (
                  <a href={p.parking_proof_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginBottom: 12, fontSize: 12, color: 'var(--ui-accent-gold)' }}>
                    Ver foto del parqueadero ↗
                  </a>
                )}
                {p.parking_proof_rejected_reason && (
                  <div style={{ fontSize: 12, color: 'var(--ui-danger)', marginBottom: 12 }}>Motivo: {p.parking_proof_rejected_reason}</div>
                )}

                {p.parking_proof_status === 'pending' && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                    <button
                      onClick={() => review(p.id, 'approved')}
                      disabled={actionLoading === p.id || rejectId === p.id}
                      style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: 'var(--ui-accent-soft)', color: 'var(--ui-accent)', border: '1px solid var(--ui-accent-soft)', cursor: 'pointer' }}
                    >Aprobar</button>
                    {rejectId === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Motivo del rechazo"
                          rows={2}
                          style={{ width: '100%', padding: 6, borderRadius: 6, fontSize: 12, border: '1px solid var(--ui-border)', background: 'var(--ui-bg)', color: 'var(--ui-fg)' }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => review(p.id, 'rejected')} disabled={actionLoading === p.id}
                            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: 'var(--ui-danger)', color: 'var(--ui-bg)', border: 'none', cursor: 'pointer' }}>Enviar</button>
                          <button onClick={() => { setRejectId(null); setRejectReason('') }}
                            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: 'var(--ui-surface-hover)', color: 'var(--ui-fg-secondary)', border: '1px solid var(--ui-border)', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setRejectId(p.id)}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: 'var(--ui-danger-soft)', color: 'var(--ui-danger)', border: '1px solid var(--ui-danger-soft)', cursor: 'pointer' }}>
                        Rechazar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
