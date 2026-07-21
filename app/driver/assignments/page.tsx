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

const STATUS_STYLES: Record<string, { label: string; bg: string; fg: string }> = {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{
          width: 24, height: 24,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent-gold)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)', margin: 0,
        }}>Asignaciones</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          {filtered.length} asignaciones
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {(['pending', 'active', 'history'] as Tab[]).map(tab => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px', borderRadius: 10,
                fontSize: 12, fontWeight: 500,
                background: isActive ? 'var(--accent-gold)' : 'var(--bg-card)',
                color: isActive ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--accent-gold-dim, #b08a5a)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              {tab === 'pending' ? 'Pendientes' : tab === 'active' ? 'Activas' : 'Historial'}
              <span style={{ marginLeft: 6, opacity: 0.6 }}>{counts[tab]}</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '64px 24px', textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.3 }}>
              <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <p style={{ fontSize: 14, margin: 0 }}>
              No hay asignaciones {activeTab === 'pending' ? 'pendientes' : activeTab === 'active' ? 'activas' : 'en historial'}
            </p>
          </div>
        ) : (
          filtered.map(a => {
            const status = STATUS_STYLES[a.status] || { label: a.status, bg: 'rgba(100,100,100,0.12)', fg: '#9ca3af' }
            const canAccept = ['pending', 'pending_acceptance', 'offered'].includes(a.status)

            return (
              <div
                key={a.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'
                  e.currentTarget.style.borderColor = 'var(--accent-gold)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', padding: '3px 10px',
                      borderRadius: 8, fontSize: 11, fontWeight: 500,
                      background: status.bg, color: status.fg,
                    }}>
                      {status.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {a.order_number || `#${a.id}`}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {a.pickup_date || a.arrival_date || ''} {a.pickup_time || a.arrival_time || ''}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12, fontSize: 13, marginBottom: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Cliente</div>
                    <div style={{ color: 'var(--text-primary)' }}>{a.customer_name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Paquete</div>
                    <div style={{ color: 'var(--text-primary)' }}>{a.package_name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Vuelo</div>
                    <div style={{ color: 'var(--text-primary)' }}>{a.airline || ''} {a.flight_number || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Destino</div>
                    <div style={{ color: 'var(--text-primary)' }}>{a.destination_address || '—'}</div>
                  </div>
                </div>

                {a.customer_phone && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Tel: {a.customer_phone}
                  </div>
                )}

                {canAccept && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleAction(a.id, 'accept')}
                      disabled={actionLoading === a.id}
                      style={{
                        padding: '6px 16px', borderRadius: 8,
                        fontSize: 12, fontWeight: 500,
                        background: 'var(--accent-gold)', color: '#000',
                        border: 'none', cursor: 'pointer',
                        opacity: actionLoading === a.id ? 0.5 : 1,
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (actionLoading !== a.id) {
                          e.currentTarget.style.background = 'var(--accent-gold-light, #e8c9a0)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (actionLoading !== a.id) {
                          e.currentTarget.style.background = 'var(--accent-gold)'
                        }
                      }}
                    >
                      {actionLoading === a.id ? 'Procesando...' : 'Aceptar'}
                    </button>
                    <button
                      onClick={() => handleAction(a.id, 'decline')}
                      disabled={actionLoading === a.id}
                      style={{
                        padding: '6px 16px', borderRadius: 8,
                        fontSize: 12, fontWeight: 500,
                        background: 'rgba(248,113,113,0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(248,113,113,0.2)',
                        cursor: 'pointer',
                        opacity: actionLoading === a.id ? 0.5 : 1,
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (actionLoading !== a.id) {
                          e.currentTarget.style.background = 'rgba(248,113,113,0.18)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (actionLoading !== a.id) {
                          e.currentTarget.style.background = 'rgba(248,113,113,0.12)'
                        }
                      }}
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
