'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/lib/admin/toast-context'

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Pruebas de parqueo
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Evidencias de estacionamiento de conductores</p>
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
                background: active ? 'var(--accent-gold)' : 'var(--bg-card)',
                color: active ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'var(--accent-gold)' : 'var(--border)'}`,
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
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando…</div>
      ) : proofs.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No hay pruebas en este estado.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {proofs.map(p => (
            <div key={p.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: p.parking_proof_status === 'approved' ? 'rgba(74,222,128,0.12)' : p.parking_proof_status === 'rejected' ? 'rgba(248,113,113,0.12)' : 'rgba(250,204,21,0.12)',
                    color: p.parking_proof_status === 'approved' ? '#4ade80' : p.parking_proof_status === 'rejected' ? '#f87171' : '#facc15',
                  }}>{p.parking_proof_status === 'approved' ? 'Aprobada' : p.parking_proof_status === 'rejected' ? 'Rechazada' : 'Pendiente'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{p.order_number} · {p.booking_reference}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 13, marginBottom: 12 }}>
                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cliente</div><div style={{ color: 'var(--text-primary)' }}>{p.customer_name}</div></div>
                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Paquete</div><div style={{ color: 'var(--text-primary)' }}>{p.package_name}</div></div>
                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div><div style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.package_price, p.currency)}</div></div>
                <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Conductor</div><div style={{ color: 'var(--text-primary)' }}>{p.driver_name || '—'}</div></div>
              </div>

              {p.parking_proof_url && (
                <a href={p.parking_proof_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginBottom: 12, fontSize: 12, color: 'var(--accent-gold)' }}>
                  Ver foto del parqueadero ↗
                </a>
              )}
              {p.parking_proof_rejected_reason && (
                <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>Motivo: {p.parking_proof_rejected_reason}</div>
              )}

              {p.parking_proof_status === 'pending' && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <button
                    onClick={() => review(p.id, 'approved')}
                    disabled={actionLoading === p.id || rejectId === p.id}
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', cursor: 'pointer' }}
                  >Aprobar</button>
                  {rejectId === p.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Motivo del rechazo"
                        rows={2}
                        style={{ width: '100%', padding: 6, borderRadius: 6, fontSize: 12, border: '1px solid var(--border)', background: 'var(--bg-subtle-2)', color: 'var(--text-primary)' }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => review(p.id, 'rejected')} disabled={actionLoading === p.id}
                          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: '#f87171', color: '#fff', border: 'none', cursor: 'pointer' }}>Enviar</button>
                        <button onClick={() => { setRejectId(null); setRejectReason('') }}
                          style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: 'var(--bg-subtle-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setRejectId(p.id)}
                      style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer' }}>
                      Rechazar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
