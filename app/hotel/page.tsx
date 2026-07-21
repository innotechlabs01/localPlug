'use client'

import { useState, useEffect, useMemo } from 'react'
import { useHotelDateFilter } from '@/lib/hotel/date-filter-context'
import {
  cardStyle, tableHeaderStyle, tableCellStyle, badge, btnPrimary,
  ORDER_STATUS,
} from '@/lib/hotel/styles'

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
    const checkins = orders.filter(o => o.status === 'checked_in')
    return {
      todayReservations: orders.filter(o => o.arrival_date === today).length,
      todayCheckins: orders.filter(o => o.arrival_date === today && (o.status === 'checked_in' || o.status === 'accepted')).length,
      todayCheckouts: orders.filter(o => o.status === 'completed' && o.arrival_date === today).length,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--danger)', marginBottom: '16px' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={btnPrimary}>Reintentar</button>
      </div>
    )
  }

  if (!hotel) return null

  const kpiData = [
    { label: 'Reservaciones hoy', value: stats.todayReservations, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>), color: 'var(--accent-gold)' },
    { label: 'Check-ins', value: stats.todayCheckins, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/></svg>), color: 'var(--success)' },
    { label: 'Check-outs', value: stats.todayCheckouts, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="15 17 10 12 15 7"/></svg>), color: 'var(--info)' },
    { label: 'Ocupacion', value: `${stats.occupancy}%`, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>), color: '#a78bfa' },
    { label: 'Ingresos periodo', value: `$${stats.periodRevenue.toLocaleString()}`, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>), color: 'var(--accent-gold)' },
    { label: 'Servicios activos', value: stats.activeServices, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>), color: '#f59e0b' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Header */}
      <div style={{ ...cardStyle, padding: '24px 28px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-dark), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{hotel.name} &mdash; {dateFrom} al {dateTo}</p>
          </div>
          <button onClick={() => window.location.reload()} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {kpiData.map(k => (
          <div key={k.label} style={{ ...cardStyle, padding: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: k.color }} />
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${k.color}15`, color: k.color, marginBottom: '12px' }}>{k.icon}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Reservations */}
      <div style={cardStyle}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Reservaciones del periodo</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{dateFrom} &mdash; {dateTo}</p>
          </div>
          <span style={badge('rgba(212,165,116,0.12)', 'var(--accent-gold)')}>{filteredOrders.length} reservaciones</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <p style={{ fontSize: '13px' }}>No hay reservaciones en este periodo</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Huesped</th>
                  <th style={tableHeaderStyle}>Paquete</th>
                  <th style={tableHeaderStyle}>Llegada</th>
                  <th style={tableHeaderStyle}>Estado</th>
                  <th style={tableHeaderStyle}>Monto</th>
                  <th style={tableHeaderStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, idx) => {
                  const b = ORDER_STATUS[o.status] || { bg: 'rgba(100,100,100,0.12)', fg: '#9ca3af', label: o.status }
                  const next = getNextAction(o.status)
                  return (
                    <tr key={o.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', transition: 'background 200ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                    >
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, background: 'rgba(212,165,116,0.12)', color: 'var(--accent-gold)' }}>
                            {o.customer_name?.charAt(0) || '?'}
                          </div>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{o.customer_name || '-'}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle}>{o.package_name || '-'}</td>
                      <td style={tableCellStyle}>
                        <div style={{ color: 'var(--text-primary)' }}>{o.arrival_date}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{o.arrival_time?.substring(0, 5) || ''}</div>
                      </td>
                      <td style={tableCellStyle}><span style={badge(b.bg, b.fg)}>{b.label}</span></td>
                      <td style={{ ...tableCellStyle, fontWeight: 600, color: 'var(--accent-gold)' }}>${o.package_price || 0}</td>
                      <td style={tableCellStyle}>
                        {next && (
                          <button onClick={() => handleOrderAction(o.id, next.action)} disabled={actionLoading === o.id}
                            style={{ ...badge('rgba(212,165,116,0.1)', 'var(--accent-gold)'), cursor: 'pointer', border: '1px solid var(--accent-gold)', opacity: actionLoading === o.id ? 0.5 : 1 }}>
                            {actionLoading === o.id ? '...' : next.label}
                          </button>
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
      <div style={cardStyle}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Habitaciones</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Habitacion</th>
                <th style={tableHeaderStyle}>Capacidad</th>
                <th style={tableHeaderStyle}>Precio/Noche</th>
                <th style={tableHeaderStyle}>Desayuno</th>
                <th style={tableHeaderStyle}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r, idx) => (
                <tr key={r.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', transition: 'background 200ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                >
                  <td style={{ ...tableCellStyle, fontWeight: 500, color: 'var(--text-primary)' }}>{r.name}</td>
                  <td style={tableCellStyle}>{r.capacity} personas</td>
                  <td style={{ ...tableCellStyle, fontWeight: 600, color: 'var(--accent-gold)' }}>${r.price_per_night}</td>
                  <td style={tableCellStyle}>{r.breakfast_included ? 'Si' : 'No'}</td>
                  <td style={tableCellStyle}>
                    <span style={badge(
                      r.status === 'available' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                      r.status === 'available' ? 'var(--success)' : 'var(--danger)',
                    )}>
                      {r.status === 'available' ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No hay habitaciones registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
