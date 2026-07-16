'use client'

import { useState, useEffect, useMemo } from 'react'
import { useHotelDateFilter } from '@/lib/hotel/date-filter-context'

interface HotelProfile {
  id: number; name: string; slug: string; description: string | null
  address: string | null; phone: string | null; email: string | null
  website: string | null; stars: number; status: string
  commission_rate: number; profile_complete: number
}

interface Room {
  id: number; name: string; capacity: number; price_per_night: number
  beds: number | null; breakfast_included: number; status: string; amenities: string | null
}

interface Order {
  id: number; order_number: string; customer_name: string; package_name: string
  package_price: number; status: string; arrival_date: string; arrival_time: string
  num_nights: number | null
}

interface Service {
  id: number; name: string; base_price: number; commission_applies: number; active: number
}

const STATUS_BADGE: Record<string, string> = {
  new: 'pending',
  accepted: 'confirmed',
  checked_in: 'in-progress',
  completed: 'completed',
  cancelled: 'cancelled',
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Nueva',
  accepted: 'Aceptada',
  checked_in: 'Check-in',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export default function HotelPage() {
  const { dateFrom, dateTo } = useHotelDateFilter()
  const [hotel, setHotel] = useState<HotelProfile | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/hotel/ensure')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setHotel(data.hotel)
        if (data.hotel.profile_complete) {
          Promise.all([
            fetch('/api/hotel/rooms').then(r => r.json()),
            fetch('/api/hotel/orders').then(r => r.json()),
            fetch('/api/hotel/services').then(r => r.json()),
          ]).then(([roomsData, ordersData, servicesData]) => {
            setRooms(roomsData.rooms || [])
            setOrders(ordersData.orders || [])
            setServices(servicesData.services || [])
          }).catch(() => {})
        }
      })
      .catch(() => setError('Error al cargar perfil'))
      .finally(() => setLoading(false))
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o.arrival_date) return false
      return o.arrival_date >= dateFrom && o.arrival_date <= dateTo
    })
  }, [orders, dateFrom, dateTo])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayOrders = orders.filter(o => o.arrival_date === today)
    const checkins = orders.filter(o => o.status === 'checked_in')

    return {
      todayReservations: todayOrders.length,
      todayCheckins: todayOrders.filter(o => o.status === 'checked_in' || o.status === 'accepted').length,
      todayCheckouts: todayOrders.filter(o => o.status === 'completed' && o.arrival_date === today).length,
      occupiedRooms: checkins.length,
      totalRooms: rooms.length,
      occupancy: rooms.length > 0 ? Math.round((checkins.length / rooms.length) * 100) : 0,
      periodRevenue: filteredOrders
        .filter(o => o.status === 'completed' || o.status === 'checked_in')
        .reduce((s, o) => s + (o.package_price || 0), 0),
      activeServices: services.filter(s => s.active).length,
    }
  }, [orders, rooms, services, filteredOrders])

  const handleOrderAction = async (orderId: number, action: string) => {
    setActionLoading(orderId)
    try {
      await fetch(`/api/hotel/orders/${orderId}/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
      })
      const res = await fetch('/api/hotel/orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } finally { setActionLoading(null) }
  }

  const getNextAction = (status: string): { action: string; label: string } | null => {
    switch (status) {
      case 'new': return { action: 'accept', label: 'Aceptar' }
      case 'accepted': return { action: 'check-in', label: 'Check-In' }
      case 'checked_in': return { action: 'check-out', label: 'Check-Out' }
      default: return null
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--danger)' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Reintentar
        </button>
      </div>
    )
  }

  if (!hotel) return null

  return (
    <div>
      {/* Hero Header */}
      <div className="drivers-hero">
        <div>
          <h1>Dashboard</h1>
          <p>{hotel.name} &mdash; {dateFrom} al {dateTo}</p>
        </div>
        <div className="drivers-toolbar">
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="drivers-kpis grid-6">
        {[
          { label: 'Reservaciones hoy', value: stats.todayReservations },
          { label: 'Check-ins', value: stats.todayCheckins },
          { label: 'Check-outs', value: stats.todayCheckouts },
          { label: 'Ocupación %', value: `${stats.occupancy}%` },
          { label: 'Ingresos período', value: `$${stats.periodRevenue.toLocaleString()}` },
          { label: 'Servicios', value: stats.activeServices },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div className="stat-label">{k.label}</div>
            <div className="stat-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Reservations */}
      <div className="res-table-card" style={{ margin: '0 24px 24px' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Reservaciones del período</h2>
            <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '4px 0 0' }}>{dateFrom} — {dateTo}</p>
          </div>
          <span className="status-badge confirmed">{filteredOrders.length} reservaciones</span>
        </div>
        <div className="table-wrap">
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-muted)' }}>
              <p style={{ fontSize: 14 }}>No hay reservaciones en este período</p>
            </div>
          ) : (
            <table className="detail-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Huésped</th>
                  <th>Paquete</th>
                  <th>Llegada</th>
                  <th>Estado</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => {
                  const badgeClass = STATUS_BADGE[o.status] || 'pending'
                  const label = STATUS_LABEL[o.status] || o.status
                  const next = getNextAction(o.status)
                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="guest-cell">
                          <div className="guest-avatar" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                            {o.customer_name?.charAt(0) || '?'}
                          </div>
                          <span style={{ fontWeight: 500 }}>{o.customer_name || '—'}</span>
                        </div>
                      </td>
                      <td>{o.package_name || '—'}</td>
                      <td>
                        <div>{o.arrival_date}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{o.arrival_time?.substring(0, 5) || ''}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${badgeClass}`}>{label}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--gold)' }}>${o.package_price || 0}</td>
                      <td>
                        {next && (
                          <div className="action-btn-group">
                            <button
                              onClick={() => handleOrderAction(o.id, next.action)}
                              disabled={actionLoading === o.id}
                              className="action-btn view"
                              title={next.label}
                            >
                              {actionLoading === o.id ? '...' : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  {next.action === 'accept' && <><path d="M20 6L9 17l-5-5" /></>}
                                  {next.action === 'check-in' && <><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /></>}
                                  {next.action === 'check-out' && <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="15 17 10 12 15 7" /></>}
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rooms Overview */}
      <div className="res-table-card" style={{ margin: '0 24px 24px' }}>
        <div className="card-header">
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Habitaciones</h2>
        </div>
        <div className="table-wrap">
          <table className="detail-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Habitación</th>
                <th>Capacidad</th>
                <th>Precio/Noche</th>
                <th>Desayuno</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td>{r.capacity} personas</td>
                  <td style={{ fontWeight: 600, color: 'var(--gold)' }}>${r.price_per_night}</td>
                  <td>{r.breakfast_included ? 'Sí' : 'No'}</td>
                  <td>
                    <span className={`status-badge ${r.status === 'available' ? 'confirmed' : 'cancelled'}`}>
                      {r.status === 'available' ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-muted)', fontSize: 14 }}>No hay habitaciones registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
