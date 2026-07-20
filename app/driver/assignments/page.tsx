'use client'

import { useState, useEffect, useCallback } from 'react'

interface Assignment {
  id: number
  order_id: number
  status: string
  pickup_date: string | null
  pickup_time: string | null
  observations: string | null
  created_at: string
  order_number: string | null
  booking_reference: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  package_name: string | null
  flight_number: string | null
  arrival_date: string | null
  arrival_time: string | null
  destination_address: string | null
  airline: string | null
}

const STATUS_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pendiente', bg: 'rgba(250,204,21,0.12)', fg: '#facc15' },
  pending_acceptance: { label: 'Esperando', bg: 'rgba(250,204,21,0.12)', fg: '#facc15' },
  offered: { label: 'Ofrecida', bg: 'rgba(96,165,250,0.12)', fg: '#60a5fa' },
  accepted: { label: 'Aceptada', bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  confirmed_to_client: { label: 'Confirmada', bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  completed: { label: 'Completada', bg: 'rgba(100,100,100,0.12)', fg: '#9ca3af' },
  cancelled: { label: 'Cancelada', bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
  declined: { label: 'Rechazada', bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
  expired: { label: 'Expirada', bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
}

type Tab = 'pending' | 'active' | 'history'

export default function DriverAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/driver/my-assignments')
      if (res.ok) {
        const data = await res.json()
        setAssignments(data.assignments || [])
      }
    } catch { /* non-critical */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAssignments()
    const interval = setInterval(fetchAssignments, 15000)
    return () => clearInterval(interval)
  }, [fetchAssignments])

  const handleAction = async (assignmentId: number, action: 'accept' | 'decline') => {
    setActionLoading(assignmentId)
    try {
      await fetch(`/api/assignments/${assignmentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      await fetchAssignments()
    } finally { setActionLoading(null) }
  }

  const filtered = assignments.filter(a => {
    if (activeTab === 'pending') return ['pending', 'pending_acceptance', 'offered'].includes(a.status)
    if (activeTab === 'active') return ['accepted', 'confirmed_to_client'].includes(a.status)
    return ['completed', 'cancelled', 'declined', 'expired'].includes(a.status)
  })

  const counts = {
    pending: assignments.filter(a => ['pending', 'pending_acceptance', 'offered'].includes(a.status)).length,
    active: assignments.filter(a => ['accepted', 'confirmed_to_client'].includes(a.status)).length,
    history: assignments.filter(a => ['completed', 'cancelled', 'declined', 'expired'].includes(a.status)).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--admin-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Asignaciones</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} asignaciones
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['pending', 'active', 'history'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === tab ? 'var(--admin-accent)' : 'var(--bg-card)',
              color: activeTab === tab ? 'var(--bg-dark)' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab ? 'var(--admin-accent)' : 'var(--border)'}`,
            }}
          >
            {tab === 'pending' ? 'Pendientes' : tab === 'active' ? 'Activas' : 'Historial'}
            <span className="ml-1.5 opacity-60">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Assignments list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <svg className="mx-auto mb-3 opacity-30" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <p className="text-sm">No hay asignaciones {activeTab === 'pending' ? 'pendientes' : activeTab === 'active' ? 'activas' : 'en historial'}</p>
          </div>
        ) : (
          filtered.map(a => {
            const status = STATUS_MAP[a.status] || { label: a.status, bg: 'rgba(100,100,100,0.12)', fg: '#9ca3af' }
            const canAccept = ['pending', 'pending_acceptance', 'offered'].includes(a.status)
            const canDecline = canAccept

            return (
              <div
                key={a.id}
                className="p-4 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{ background: status.bg, color: status.fg }}
                    >
                      {status.label}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {a.order_number || `#${a.id}`}
                    </span>
                  </div>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {a.pickup_date || a.arrival_date || ''} {a.pickup_time || a.arrival_time || ''}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Cliente</div>
                    <div style={{ color: 'var(--text-primary)' }}>{a.customer_name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Paquete</div>
                    <div style={{ color: 'var(--text-primary)' }}>{a.package_name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Vuelo</div>
                    <div style={{ color: 'var(--text-primary)' }}>{a.airline || ''} {a.flight_number || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Destino</div>
                    <div style={{ color: 'var(--text-primary)' }}>{a.destination_address || '—'}</div>
                  </div>
                </div>

                {a.customer_phone && (
                  <div className="text-[12px] mb-3" style={{ color: 'var(--text-muted)' }}>
                    Tel: {a.customer_phone}
                  </div>
                )}

                {canAccept && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(a.id, 'accept')}
                      disabled={actionLoading === a.id}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium text-black transition-all disabled:opacity-50"
                      style={{ background: 'var(--admin-accent)' }}
                    >
                      {actionLoading === a.id ? 'Procesando...' : 'Aceptar'}
                    </button>
                    <button
                      onClick={() => handleAction(a.id, 'decline')}
                      disabled={actionLoading === a.id}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
