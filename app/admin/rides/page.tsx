'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { adminFetch } from '@/lib/admin/admin-fetch'

interface RideOrder {
  id: string
  bookingReference: string
  status: string
  dispatchStatus: string
  paymentStatus: string
  totalAmount: number
  destinationAddress: string
  travelerProfile: string
  guest: { firstName: string; lastName: string; email: string }
  service: { name: string }
  driverAssigned: { id: number; name: string; phone: string } | null
  createdAt: string
}

export default function AdminOnDemandRidesPage() {
  const [rides, setRides] = useState<RideOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRides = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/reservations?limit=200')
      if (res.ok) {
        const data = await res.json()
        const all: RideOrder[] = data.reservations || []
        setRides(all.filter(r => r.travelerProfile === 'on_demand' || (r.bookingReference || '').startsWith('RIDE-')))
      }
    } catch (err) {
      console.error('[Admin Rides] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRides()
    const interval = setInterval(() => {
      if (!document.hidden) fetchRides()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchRides])

  return (
    <div className="admin-page space-y-5">
      <div className="admin-section-header">
        <div>
          <h1 className="admin-page-title">On-Demand Rides (Ciudad)</h1>
          <p className="admin-section-desc">
            Seguimiento de viajes solicitados desde la App Cliente (/ride), separados de los traslados programados de Aeropuerto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/maps" className="admin-btn admin-btn-primary admin-btn-sm">
            Ver Mapa GPS en Vivo →
          </Link>
        </div>
      </div>

      <div className="admin-grid-4">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Total On-Demand</div>
          <div className="admin-kpi-value">{rides.length}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Buscando Conductor</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-warning)' }}>
            {rides.filter(r => !r.driverAssigned && r.status !== 'completed').length}
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">En Curso</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-info)' }}>
            {rides.filter(r => r.driverAssigned && r.status !== 'completed').length}
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Ingresos (Tarjeta)</div>
          <div className="admin-kpi-value" style={{ color: 'var(--ui-accent)' }}>
            ${rides.reduce((s, r) => s + Number(r.totalAmount || 0), 0).toFixed(0)}
          </div>
        </div>
      </div>

      <section className="admin-card">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">Solicitudes On-Demand</span>
          <span className="admin-badge neutral">{rides.length} viajes</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Destino</th>
                  <th>Conductor</th>
                  <th>Pago</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--ui-fg-muted)' }}>Cargando...</td></tr>
                ) : rides.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--ui-fg-muted)' }}>Aún no hay viajes on-demand registrados.</td></tr>
                ) : (
                  rides.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.bookingReference}</td>
                      <td>{r.guest.firstName} {r.guest.lastName}</td>
                      <td>{r.service.name} · ${Number(r.totalAmount || 0).toFixed(0)}</td>
                      <td>{r.destinationAddress || '—'}</td>
                      <td>{r.driverAssigned ? r.driverAssigned.name : 'Buscando...'}</td>
                      <td><span className="admin-badge accent">{r.paymentStatus || 'card'}</span></td>
                      <td><span className="admin-badge info">{r.dispatchStatus || r.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
