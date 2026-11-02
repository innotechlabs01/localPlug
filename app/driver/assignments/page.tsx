'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEventStream } from '@/lib/use-event-stream'
import { useToast } from '@/lib/admin/toast-context'

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
  airport_parking: number | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pendiente', bg: 'var(--ui-warning-soft)', fg: 'var(--ui-warning)' },
  pending_acceptance: { label: 'Esperando', bg: 'var(--ui-warning-soft)', fg: 'var(--ui-warning)' },
  offered: { label: 'Ofrecida', bg: 'var(--ui-info-soft)', fg: 'var(--ui-info)' },
  accepted: { label: 'Aceptada', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)' },
  confirmed_to_client: { label: 'Confirmada', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)' },
  en_route: { label: 'En camino', bg: 'var(--ui-info-soft)', fg: 'var(--ui-info)' },
  in_progress: { label: 'Pasajero a bordo', bg: 'var(--ui-info-soft)', fg: 'var(--ui-info)' },
  completed: { label: 'Completada', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)' },
  cancelled: { label: 'Cancelada', bg: 'var(--ui-danger-soft)', fg: 'var(--ui-danger)' },
  declined: { label: 'Rechazada', bg: 'var(--ui-danger-soft)', fg: 'var(--ui-danger)' },
  expired: { label: 'Expirada', bg: 'var(--ui-danger-soft)', fg: 'var(--ui-danger)' },
}

type Tab = 'pending' | 'active' | 'history'

export default function DriverAssignmentsPage() {
  const { showToast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [parkingAnswer, setParkingAnswer] = useState<'yes' | 'no' | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/driver/my-assignments')
      if (res.ok) {
        const data = await res.json()
        setAssignments(data.assignments || [])
      } else {
        showToast('No se pudieron cargar las asignaciones')
      }
    } catch {
      showToast('Error de red cargando asignaciones')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchAssignments()
    const interval = setInterval(fetchAssignments, 15000)
    return () => clearInterval(interval)
  }, [fetchAssignments])

  useEventStream({
    'driver.assignment_offered': () => { fetchAssignments() },
    'driver.assignment_accepted': () => { fetchAssignments() },
    'driver.assignment_declined': () => { fetchAssignments() },
    'driver.en_route': () => { fetchAssignments() },
    'trip.pickedup': () => { fetchAssignments() },
    'driver.trip_completed': () => { fetchAssignments() },
    'driver.trip_cancelled': () => { fetchAssignments() },
  }, { pollMs: 8000 })

  const handleDriverAction = async (
    assignmentId: number,
    action: 'accept' | 'decline' | 'en_route' | 'pickedup' | 'complete' | 'cancel',
    reason?: string,
    metadata?: Record<string, unknown>
  ) => {
    setActionLoading(assignmentId)
    try {
      const res = await fetch(`/api/driver/assignments/${assignmentId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, metadata }),
      })
      if (res.ok) {
        await fetchAssignments()
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

  const startComplete = (id: number) => {
    setCompletingId(id)
    setParkingAnswer(null)
    setProofFile(null)
    setProofUrl(null)
  }

  const handleComplete = async () => {
    if (!completingId) return
    setActionLoading(completingId)
    try {
      let url: string | null = null
      if (parkingAnswer === 'yes') {
        if (!proofFile) {
          showToast('Debe cargar la foto del parqueadero')
          return
        }
        if (!proofUrl) {
          setUploadingProof(true)
          const form = new FormData()
          form.append('file', proofFile)
          const up = await fetch('/api/driver/parking-proof/upload', { method: 'POST', body: form })
          const upData = await up.json()
          if (!up.ok || !upData.url) {
            showToast(upData.error || 'Error al subir la foto')
            setUploadingProof(false)
            return
          }
          url = upData.url
          setUploadingProof(false)
        }
      }
      await handleDriverAction(completingId, 'complete', undefined, {
        airport_parking: parkingAnswer === 'yes',
        parking_proof_url: url,
      })
      setCompletingId(null)
      setParkingAnswer(null)
      setProofFile(null)
      setProofUrl(null)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = assignments.filter((a) => {
    if (activeTab === 'pending') return ['pending', 'pending_acceptance', 'offered'].includes(a.status)
    if (activeTab === 'active') return ['accepted', 'confirmed_to_client', 'en_route', 'in_progress'].includes(a.status)
    return ['completed', 'cancelled', 'declined', 'expired'].includes(a.status)
  })

  const counts = {
    pending: assignments.filter((a) => ['pending', 'pending_acceptance', 'offered'].includes(a.status)).length,
    active: assignments.filter((a) => ['accepted', 'confirmed_to_client', 'en_route', 'in_progress'].includes(a.status)).length,
    history: assignments.filter((a) => ['completed', 'cancelled', 'declined', 'expired'].includes(a.status)).length,
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
          <h1 className="admin-page-title">Mis asignaciones</h1>
          <p className="admin-section-desc">
            Gestiona tus asignaciones de viajes: acepta nuevas, avisa cuando estás en camino,
            recogiste al pasajero o finalizaste el servicio.
          </p>
        </div>
      </section>

      <div className="admin-grid-3 admin-mb-4">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Pendientes</div>
          <div className="admin-kpi-value">{counts.pending}</div>
          <div className="admin-kpi-sub neutral">por aceptar</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Activas</div>
          <div className="admin-kpi-value">{counts.active}</div>
          <div className="admin-kpi-sub neutral">en curso</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Historial</div>
          <div className="admin-kpi-value">{counts.history}</div>
          <div className="admin-kpi-sub neutral">completadas</div>
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
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/></svg>
              <h3>
                {activeTab === 'pending' ? 'No hay asignaciones pendientes'
                  : activeTab === 'active' ? 'No tienes viajes activos'
                  : 'Sin historial de viajes'}
              </h3>
              <p style={{ color: 'var(--ui-fg-muted)', fontSize: 13 }}>
                {activeTab === 'pending'
                  ? 'Cuando llegue una nueva asignación, aparecerá aquí para que la aceptes o rechaces.'
                  : activeTab === 'active'
                    ? 'Tus viajes aceptados y en curso se mostrarán aquí.'
                    : 'Tus viajes finalizados aparecerán aquí.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((a) => {
                const status = STATUS_STYLES[a.status] || { label: a.status, bg: 'rgba(100,100,100,0.12)', fg: 'var(--ui-fg-secondary)' }
                const canAccept = ['pending', 'pending_acceptance', 'offered'].includes(a.status)

                return (
                  <div
                    key={a.id}
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
                          {a.order_number || `#${a.id}`}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>
                        {a.pickup_date || a.arrival_date || ''} {a.pickup_time || a.arrival_time || ''}
                      </span>
                    </div>
                    <div className="admin-res-body">
                      <div className="admin-res-row">
                        <span className="admin-res-label">Cliente</span>
                        <span>{a.customer_name || '—'}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Paquete</span>
                        <span>{a.package_name || '—'}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Vuelo</span>
                        <span style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 11 }}>{a.airline || ''} {a.flight_number || '—'}</span>
                      </div>
                      <div className="admin-res-row">
                        <span className="admin-res-label">Destino</span>
                        <span>{a.destination_address || '—'}</span>
                      </div>
                      {a.customer_phone && (
                        <div className="admin-res-row">
                          <span className="admin-res-label">Teléfono</span>
                          <span>{a.customer_phone}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {canAccept && (
                        <>
                          <button
                            onClick={() => handleDriverAction(a.id, 'accept')}
                            disabled={actionLoading === a.id}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                          >
                            {actionLoading === a.id ? 'Procesando...' : 'Aceptar'}
                          </button>
                          <button
                            onClick={() => handleDriverAction(a.id, 'decline')}
                            disabled={actionLoading === a.id}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            style={{ border: '1px solid var(--ui-danger)', color: 'var(--ui-danger)' }}
                          >
                            {actionLoading === a.id ? 'Procesando...' : 'Rechazar'}
                          </button>
                        </>
                      )}
                      {!canAccept && ['accepted', 'confirmed_to_client'].includes(a.status) && (
                        <button
                          onClick={() => handleDriverAction(a.id, 'en_route')}
                          disabled={actionLoading === a.id}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          {actionLoading === a.id ? 'Procesando...' : 'En camino'}
                        </button>
                      )}
                      {!canAccept && a.status === 'en_route' && (
                        <button
                          onClick={() => handleDriverAction(a.id, 'pickedup')}
                          disabled={actionLoading === a.id}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          {actionLoading === a.id ? 'Procesando...' : 'Recogí pasajero'}
                        </button>
                      )}
                      {!canAccept && ['accepted', 'confirmed_to_client', 'en_route', 'in_progress'].includes(a.status) && (
                        <button
                          onClick={() => startComplete(a.id)}
                          disabled={actionLoading === a.id}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                        >
                          {actionLoading === a.id ? 'Finalizando...' : 'Finalizar viaje'}
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

      {completingId !== null && (
        <div className="admin-modal-overlay open" onClick={() => setCompletingId(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Finalizar viaje</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setCompletingId(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 13, color: 'var(--ui-fg-muted)', marginBottom: 16 }}>
                ¿Estacionó en el parqueadero del aeropuerto?
              </p>

              {!parkingAnswer && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <button
                    onClick={() => setParkingAnswer('yes')}
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    style={{ flex: 1 }}
                  >
                    Sí, subir foto
                  </button>
                  <button
                    onClick={() => setParkingAnswer('no')}
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    style={{ flex: 1 }}
                  >
                    No
                  </button>
                </div>
              )}

              {parkingAnswer === 'yes' && (
                <div style={{ marginBottom: 16 }}>
                  {!proofFile ? (
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                      className="admin-input admin-input-sm"
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ui-fg-muted)' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proofFile.name}</span>
                      {proofUrl !== null && <span style={{ color: 'var(--ui-accent)' }}>✓ listo</span>}
                    </div>
                  )}
                  {!proofUrl && (
                    <button
                      onClick={async () => {
                        if (!proofFile) return
                        setUploadingProof(true)
                        const form = new FormData()
                        form.append('file', proofFile)
                        const up = await fetch('/api/driver/parking-proof/upload', { method: 'POST', body: form })
                        const upData = await up.json()
                        if (!up.ok || !upData.url) {
                          showToast(upData.error || 'Error al subir la foto')
                        } else {
                          setProofUrl(upData.url)
                        }
                        setUploadingProof(false)
                      }}
                      disabled={uploadingProof}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      style={{ width: '100%', marginTop: 10 }}
                    >
                      {uploadingProof ? 'Subiendo...' : 'Subir foto'}
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setCompletingId(null); setParkingAnswer(null); setProofFile(null); setProofUrl(null) }}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleComplete}
                  disabled={actionLoading === completingId || (parkingAnswer === 'yes' && !proofUrl)}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  style={{ flex: 1 }}
                >
                  {actionLoading === completingId ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
