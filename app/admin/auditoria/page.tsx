'use client'

import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface AuditRow {
  id: number
  order_id: number
  actor_type: string
  actor_id: number | null
  actor_name: string | null
  action: string
  from_status: string | null
  to_status: string
  reason: string | null
  metadata: string | null
  created_at: string
  order_number: string | null
  booking_reference: string | null
  driver_name: string | null
  hotel_name: string | null
  source: 'driver' | 'hotel'
}

const ACTION_LABEL: Record<string, string> = {
  // Driver actions
  accepted: 'Aceptó asignación',
  declined: 'Rechazó asignación',
  en_route: 'En camino',
  pickedup: 'Recogió pasajero',
  completed: 'Completó viaje',
  cancelled: 'Canceló viaje',
  parking_proof_submitted: 'Comprobante de parqueo',
  offered: 'Oferta de asignación',
  // Hotel actions
  confirm_room: 'Confirmó habitación',
  decline_room: 'Rechazó habitación',
  check_in: 'Check-in',
  check_out: 'Check-out',
  reschedule_requested: 'Solicitó reprogramar habitación',
  room_ready: 'Habitación lista',
}

const ACTION_COLOR: Record<string, string> = {
  accepted: 'var(--ui-accent)',
  declined: 'var(--ui-danger)',
  en_route: 'var(--ui-info)',
  pickedup: 'var(--ui-accent)',
  completed: 'var(--ui-accent)',
  cancelled: 'var(--ui-danger)',
  reschedule_requested: 'var(--ui-warning)',
  parking_proof_submitted: 'var(--ui-warning)',
  offered: 'var(--ui-info)',
  confirm_room: 'var(--ui-accent)',
  decline_room: 'var(--ui-danger)',
  check_in: 'var(--ui-info)',
  check_out: 'var(--ui-accent)',
  room_ready: 'var(--ui-accent)',
}

export default function AuditoriaPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [driverRes, hotelRes] = await Promise.all([
        adminFetch(`/api/admin/dispatch/audit-log?limit=200`),
        adminFetch(`/api/admin/hotel/audit-log?limit=200`),
      ])
      const driverData = driverRes.ok ? await driverRes.json() : { audit: [] }
      const hotelData = hotelRes.ok ? await hotelRes.json() : { audit: [] }

      const combined: AuditRow[] = [
        ...(driverData.audit || []).map((a: any) => {
          const { source: _s, ...rest } = a
          return {
            ...rest,
            source: 'driver' as const,
            actor_name: a.driver_name || a.actor_name || '—',
          }
        }),
        ...(hotelData.audit || []).map((a: any) => {
          const { source: _s, ...rest } = a
          return {
            ...rest,
            source: 'hotel' as const,
            actor_name: a.actor_name || 'Hotel',
            action: a.action as string,
          }
        }),
      ]
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setAudit(combined)
    } catch (err) {
      console.error('audit load', err)
      showToast('No se pudo cargar la auditoría')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const filtered = audit.filter((a) => {
    if (filterAction !== 'all' && a.action !== filterAction) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (a.actor_name || '').toLowerCase().includes(q) ||
        (a.driver_name || '').toLowerCase().includes(q) ||
        (a.order_number || a.booking_reference || '').toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q)
      )
    }
    return true
  })

  const actions = [...new Set(audit.map((a) => a.action))]

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty" style={{ padding: '48px 24px' }}>
          <h3>Cargando auditoría...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Auditoría de Movimientos</h1>
          <p className="admin-section-desc">
            Historial inmutable de todos los movimientos de conductores y hoteles:
            aceptaciones, rechazos, cambios de estado, check-in/check-out y cancelaciones.
            Ideal para control y trazabilidad ante el cliente y el equipo de despacho.
          </p>
        </div>
        <div className="admin-flex-between" style={{ gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className={`admin-tab ${filterAction === 'all' ? 'active' : ''}`}
              onClick={() => setFilterAction('all')}
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              Todas
            </button>
            {actions.map((act) => (
              <button
                key={act}
                className={`admin-tab ${filterAction === act ? 'active' : ''}`}
                onClick={() => setFilterAction(act)}
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                {ACTION_LABEL[act] || act}
              </button>
            ))}
          </div>
          <div className="admin-field" style={{ minWidth: 200 }}>
            <label className="admin-field-label">Buscar</label>
            <input
              className="admin-input"
              placeholder="Actor, orden, referencia o acción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Movimientos</h2>
          <span className="admin-badge neutral">{filtered.length} eventos</span>
        </div>
        <div className="admin-card-body">
          {filtered.length === 0 ? (
            <div className="admin-empty" style={{ padding: '24px 24px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <h3>Sin movimientos registrados</h3>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Actor</th>
                    <th>Origen</th>
                    <th>Acción</th>
                    <th>De → A</th>
                    <th>Orden / Reserva</th>
                    <th>Conductor / Hotel</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontSize: 12, fontFamily: 'var(--ui-font-mono)', color: 'var(--ui-fg-muted)' }}>
                        {new Date(a.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td>
                        <div style={{ fontSize: 13, color: 'var(--ui-fg)', fontWeight: 500 }}>
                          {a.actor_name || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>
                          {(a.actor_type === 'driver' ? 'Conductor' : a.actor_type === 'admin' ? 'Admin' : a.actor_type === 'dispatch' ? 'Despacho' : 'Sistema')} · #{a.actor_id}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>
                          {a.source === 'driver' ? 'Conductor' : 'Hotel'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge`} style={{ background: ACTION_COLOR[a.action] || 'var(--ui-border)', color: 'var(--ui-bg)', fontSize: 11 }}>
                          {ACTION_LABEL[a.action] || a.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>{a.from_status || '—'}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-fg)' }}>{a.to_status}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 12 }}>
                        {a.order_number || a.booking_reference || '—'}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{a.driver_name || a.hotel_name || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--ui-fg-muted)' }}>{a.reason || '—'}</td>
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
