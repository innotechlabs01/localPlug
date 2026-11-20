'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEventStream } from '@/lib/use-event-stream'
import { useToast } from '@/lib/admin/toast-context'

interface HotelReservation {
  id: number
  order_number: string | null
  booking_reference: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  package_name: string | null
  flight_number: string | null
  arrival_date: string | null
  arrival_time: string | null
  return_date: string | null
  return_time: string | null
  destination_address: string | null
  room_name: string | null
  room_type: string | null
  num_nights: number | null
  price_per_night: number | null
  status: string
  dispatch_status: string | null
  payment_status: string | null
  driver_name: string | null
  driver_phone: string | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pendiente', bg: 'var(--ui-warning-soft)', fg: 'var(--ui-warning)' },
  confirmed: { label: 'Confirmada', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)' },
  awaiting_payment: { label: 'Esperando Pago', bg: 'var(--ui-info-soft)', fg: 'var(--ui-info)' },
  assigned: { label: 'Asignada', bg: 'var(--ui-info-soft)', fg: 'var(--ui-info)' },
  in_progress: { label: 'En Curso', bg: 'var(--ui-info-soft)', fg: 'var(--ui-info)' },
  completed: { label: 'Completada', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)' },
  cancelled: { label: 'Cancelada', bg: 'var(--ui-danger-soft)', fg: 'var(--ui-danger)' },
}

type Tab = 'pending' | 'active' | 'history'

export default function HotelReservationsPage() {
  const { showToast } = useToast()
  const [reservations, setReservations] = useState<HotelReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/hotel/reservations')
      if (res.ok) {
        const data = await res.json()
        setReservations(data.reservations || [])
      } else {
        showToast('No se pudieron cargar las reservas')
      }
    } catch {
      showToast('Error de red cargando reservas')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchReservations()
    const interval = setInterval(fetchReservations, 15000)
    return () => clearInterval(interval)
  }, [fetchReservations])

  useEventStream({
    'hotel.room_confirmed': () => { fetchReservations() },
    'hotel.room_declined': () => { fetchReservations() },
    'hotel.guest_checked_in': () => { fetchReservations() },
    'hotel.guest_checked_out': () => { fetchReservations() },
    'hotel.reschedule_requested': () => { fetchReservations() },
    'hotel.room_ready': () => { fetchReservations() },
    'hotel.room_cancelled': () => { fetchReservations() },
  }, { pollMs: 8000 })

  const handleHotelAction = async (
    orderId: number,
    action: 'confirm_room' | 'decline_room' | 'check_in' | 'check_out' | 'room_ready' | 'cancelled' | 'reschedule_requested',
    reason?: string,
    metadata?: Record<string, unknown>
  ) => {
    setActionLoading(orderId)
    try {
      const res = await fetch(`/api/hotel/reservations/${orderId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, metadata }),
      })
      if (res.ok) {
        await fetchReservations()
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'No se pudo procesar la acción')
      }
    } catch {
      showToast('Error de red al procesar la acción')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = reservations.filter((r) => {
    if (activeTab === 'pending') return ['pending', 'awaiting_payment'].includes(r.dispatch_status || r.status)
    if (activeTab === 'active') return ['confirmed', 'assigned', 'in_progress', 'checked_in'].includes(r.dispatch_status || r.status)
    return ['completed', 'cancelled', 'checked_out'].includes(r.dispatch_status || r.status)
  })

  const counts = {
    pending: reservations.filter((r) => ['pending', 'awaiting_payment'].includes(r.dispatch_status || r.status)).length,
    active: reservations.filter((r) => ['confirmed', 'assigned', 'in_progress', 'checked_in'].includes(r.dispatch_status || r.status)).length,
    history: reservations.filter((r) => ['completed', 'cancelled', 'checked_out'].includes(r.dispatch_status || r.status)).length,
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty" style={{ padding: '60px 24px' }}>
          <div className="admin-skeleton-text long" style={{ height: 32, width: '40%', margin: '0 auto 16px' }} />
          <div className="admin-skeleton-text short" style={{ height: 20, width: '20%', margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Mis Reservas de Hotel</h1>
          <p className="admin-section-desc">
            Gestiona las reservas de habitaciones de tu hotel: confirma habitaciones, registra check-in/check-out y avisa al admin de cualquier cambio.
          </p>
        </div>
      </section>

      <div className="admin-grid-3 admin-mb-4">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Pendientes</div>
          <div className="admin-kpi-value">{counts.pending}</div>
          <div className="admin-kpi-sub neutral">por confirmar</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Activas</div>
          <div className="admin-kpi-value">{counts.active}</div>
          <div className="admin-kpi-sub neutral">en curso</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Historial</div>
          <div className="admin-kpi-value">{counts.history}</div>
          <div className="admin-kpi-sub neutral">finalizadas</div>
        </div>
      </div>

      <div className="admin-tabs admin-mb-4">
        <button
          className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pendientes <span className="admin-badge neutral">{counts.pending}</span>
        </button>
        <button
          className={`admin-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Activas <span className="admin-badge neutral">{counts.active}</span>
        </button>
        <button
          className={`admin-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historial <span className="admin-badge neutral">{counts.history}</span>
        </button>
      </div>

      <section className="admin-card">
        <div className="admin-card-body">
          {filtered.length === 0 ? (
            <div className="admin-empty" style={{ padding: '48px 24px' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>
                {activeTab === 'pending' ? 'No hay reservas pendientes'
                  : activeTab === 'active' ? 'No tienes reservas activas'
                  : 'Sin historial de reservas'}
              </h3>
              <p style={{ color: 'var(--ui-fg-muted)', fontSize: 13 }}>
                {activeTab === 'pending'
                  ? 'Cuando llegue una nueva reserva de habitación, aparecerá aquí para que la confirmes.'
                  : activeTab === 'active'
                    ? 'Tus reservas confirmadas y en curso se mostrarán aquí.'
                    : 'Tus reservas finalizadas aparecerán aquí.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((r) => {
                const status = STATUS_STYLES[r.dispatch_status || r.status] || { label: r.dispatch_status || r.status, bg: 'rgba(100,100,100,0.12)', fg: '#9ca3af' }
                const canConfirm = ['pending', 'awaiting_payment'].includes(r.dispatch_status || r.status)

                return (
                  <div
                    key={r.id}
                    className="admin-res-card"
                    onClick={() => {}}
                    style={{ cursor: 'default' }}
                  >
                    <div className="admin-res-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            display: 'inline-flex', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                            background: status.bg, color: status.fg,
                          }}
                        >
                          {status.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>
                          {r.order_number || `#${r.id}`}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>
                        {r.arrival_date || ''} {r.arrival_time || ''}
                      </span>
                    </div>
                    <div className="admin-res-body">
                      <div className="admin-res-row">
                        <span className="admin-res-label">Huésped</span>
                        <span>{r.customer_name || '—'}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Paquete</span>
                        <span>{r.package_name || '—'}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Vuelo</span>
                        <span style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 11 }}>{r.flight_number || '—'}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Habitación</span>
                        <span>{r.room_name || '—'}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Noches</span>
                        <span>{r.num_nights || 0}</span>
                      </div>
                      {r.driver_name && (
                        <div className="admin-res-row">
                          <span className="admin-res-label">Conductor</span>
                          <span>{r.driver_name}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {canConfirm && (
                        <>
                          <button
                            onClick={() => handleHotelAction(r.id, 'confirm_room')}
                            disabled={actionLoading === r.id}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                          >
                            {actionLoading === r.id ? 'Procesando...' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => handleHotelAction(r.id, 'decline_room')}
                            disabled={actionLoading === r.id}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            style={{ border: '1px solid var(--ui-danger)', color: 'var(--ui-danger)' }}
                          >
                            {actionLoading === r.id ? 'Procesando...' : 'Rechazar'}
                          </button>
                        </>
                      )}
                      {!canConfirm && ['confirmed', 'assigned'].includes(r.dispatch_status || r.status) && (
                        <button
                          onClick={() => handleHotelAction(r.id, 'check_in')}
                          disabled={actionLoading === r.id}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          {actionLoading === r.id ? 'Procesando...' : 'Check-in'}
                        </button>
                      )}
                      {!canConfirm && r.dispatch_status === 'checked_in' && (
                        <button
                          onClick={() => handleHotelAction(r.id, 'check_out')}
                          disabled={actionLoading === r.id}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          {actionLoading === r.id ? 'Procesando...' : 'Check-out'}
                        </button>
                      )}
                      {!canConfirm && ['confirmed', 'assigned', 'checked_in'].includes(r.dispatch_status || r.status) && (
                        <button
                          onClick={() => handleHotelAction(r.id, 'cancelled')}
                          disabled={actionLoading === r.id}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          style={{ border: '1px solid var(--ui-danger)', color: 'var(--ui-danger)' }}
                        >
                          {actionLoading === r.id ? 'Procesando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
