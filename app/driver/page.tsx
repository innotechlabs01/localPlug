'use client'

import { useState, useEffect, useCallback } from 'react'

interface DriverProfile {
  id: number
  name: string
  phone: string | null
  email: string | null
  vehicle: string
  plate: string
  category: string
  status: string
  rating: number
  languages: string | null
  experience_level: string | null
  photo_url: string | null
  commission_rate: number | null
  profile_complete: number
  license_number: string | null
  license_expiry: string | null
  bank_account: string | null
  city: string | null
  vip_compatible: number
}

interface DriverStats {
  total: number
  completed: number
  pending: number
  active: number
  earnings: number
  acceptanceRate: number
  commissionRate: number
}

interface Assignment {
  id: number
  order_id: number
  driver_id: number
  status: string
  vehicle_type: string | null
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

type Tab = 'pending' | 'active' | 'history'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  pending_acceptance: { label: 'Pendiente aceptación', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  offered: { label: 'Ofrecido', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  accepted: { label: 'Aceptado', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  confirmed: { label: 'Confirmado', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  completed: { label: 'Completado', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
  cancelled: { label: 'Cancelado', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  expired: { label: 'Expirado', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  declined: { label: 'Rechazado', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
}

export default function DriverPage() {
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', phone: '', email: '', vehicle: '', plate: '', category: 'standard',
    city: '', languages: 'Spanish', experience_level: 'Standard',
    license_number: '', license_expiry: '', bank_account: '',
    vip_compatible: false, photo_url: '',
    emergency_contact: '', emergency_phone: '',
  })

  useEffect(() => {
    fetch('/api/driver/ensure')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
          return
        }
        const d = data.driver
        setDriver(d)
        setForm({
          name: d.name || '', phone: d.phone || '', email: d.email || '',
          vehicle: d.vehicle || '', plate: d.plate || '', category: d.category || 'standard',
          city: d.city || '', languages: d.languages || 'Spanish',
          experience_level: d.experience_level || 'Standard',
          license_number: d.license_number || '', license_expiry: d.license_expiry || '',
          bank_account: d.bank_account || '', vip_compatible: !!d.vip_compatible,
          photo_url: d.photo_url || '', emergency_contact: '', emergency_phone: '',
        })
        if (d.profile_complete) {
          fetchMetrics()
          fetchAssignments()
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/driver/metrics')
      const data = await res.json()
      if (data.stats) setStats(data.stats)
    } catch { /* non-critical */ }
  }, [])

  const fetchAssignments = useCallback(async () => {
    if (!driver) return
    try {
      const res = await fetch(`/api/driver/my-assignments?driverId=${driver.id}`)
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch { /* non-critical */ }
  }, [driver?.id])

  useEffect(() => {
    if (!driver?.profile_complete) return
    fetchAssignments()
    const interval = setInterval(fetchAssignments, 30000)
    return () => clearInterval(interval)
  }, [driver?.profile_complete, fetchAssignments])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, vip_compatible: form.vip_compatible }),
      })
      if (res.ok) {
        const data = await fetch('/api/driver/ensure').then(r => r.json())
        if (data.driver) {
          setDriver(data.driver)
          setEditMode(false)
        }
      }
    } catch (err) {
      console.error('Failed to save', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (assignmentId: number, action: 'accept' | 'decline') => {
    setActionLoading(assignmentId)
    try {
      const endpoint = action === 'accept'
        ? `/api/assignments/${assignmentId}/accept`
        : `/api/assignments/${assignmentId}/decline`
      await fetch(endpoint, { method: 'POST' })
      await fetchAssignments()
      fetchMetrics()
    } catch (err) {
      console.error(`Failed to ${action}`, err)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'pending') return ['pending_acceptance', 'offered'].includes(a.status)
    if (activeTab === 'active') return ['accepted', 'confirmed'].includes(a.status)
    return ['declined', 'completed', 'cancelled', 'expired'].includes(a.status)
  })

  const tabCounts = {
    pending: assignments.filter(a => ['pending_acceptance', 'offered'].includes(a.status)).length,
    active: assignments.filter(a => ['accepted', 'confirmed'].includes(a.status)).length,
    history: assignments.filter(a => ['declined', 'completed', 'cancelled', 'expired'].includes(a.status)).length,
  }

  const tabLabels: Record<Tab, string> = {
    pending: 'Pendientes',
    active: 'Activas',
    history: 'Historial',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    const isNotFound = error === 'driver_not_found'
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className={`text-lg mb-4 ${isNotFound ? 'text-yellow-400' : 'text-red-400'}`}>
            {isNotFound
              ? 'No se encontró tu perfil de conductor. Contacte al administrador para que te registre.'
              : error}
          </div>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Reintentar</button>
        </div>
      </div>
    )
  }

  if (!driver) return null

  const needsProfile = !driver.profile_complete || editMode

  return (
    <div>
      <div className="drivers-hero">
        <div>
          <h1>Dashboard — {driver.name}</h1>
          <p>Panel de conductor</p>
        </div>
        <div className="drivers-toolbar">
          {driver.profile_complete && !editMode && (
            <button onClick={() => setEditMode(true)} className="btn btn-secondary">Editar Perfil</button>
          )}
        </div>
      </div>

      {needsProfile ? (
        <div style={{ padding: '0 24px 24px' }}>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)', marginBottom: 16 }}>
              {driver.profile_complete ? 'Editar Perfil' : 'Completa Tu Perfil'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 24 }}>
              Completa los datos de tu vehículo y licencia para comenzar a recibir asignaciones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombre completo *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Input label="Teléfono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <Input label="Ciudad" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Vehículo *" value={form.vehicle} onChange={v => setForm(f => ({ ...f, vehicle: v }))} />
              <Input label="Placa *" value={form.plate} onChange={v => setForm(f => ({ ...f, plate: v }))} />

              <div>
                <label style={{ fontSize: 11, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>Categoría</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="select">
                  <option value="standard">Estándar</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>Idiomas</label>
                <select value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} className="select">
                  <option value="Spanish">Español</option>
                  <option value="English">Inglés</option>
                  <option value="Spanish, English">Español e Inglés</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>Experiencia</label>
                <select value={form.experience_level} onChange={e => setForm(f => ({ ...f, experience_level: e.target.value }))} className="select">
                  <option value="Standard">Estándar</option>
                  <option value="Experienced">Experimentado</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <Input label="Número de licencia" value={form.license_number} onChange={v => setForm(f => ({ ...f, license_number: v }))} />
              <Input label="Vencimiento de licencia" value={form.license_expiry} onChange={v => setForm(f => ({ ...f, license_expiry: v }))} type="date" />
              <Input label="Cuenta bancaria" value={form.bank_account} onChange={v => setForm(f => ({ ...f, bank_account: v }))} />

              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="vip" checked={form.vip_compatible} onChange={e => setForm(f => ({ ...f, vip_compatible: e.target.checked }))} />
                <label htmlFor="vip" style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>Compatible VIP</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving || !form.name || !form.vehicle || !form.plate} className="btn btn-primary">
                {saving ? 'Guardando...' : driver.profile_complete ? 'Guardar Cambios' : 'Completar Perfil'}
              </button>
              {editMode && (
                <button onClick={() => setEditMode(false)} className="btn btn-secondary">
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {stats && (
            <div className="drivers-kpis grid-6">
              <div className="stat-card">
                <div className="stat-label">Viajes totales</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completados</div>
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-change up">+{stats.completed}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pendientes</div>
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-change down">{stats.pending} activos</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Activos</div>
                <div className="stat-value">{stats.active}</div>
                <div className="stat-change up">En curso</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Ganancias</div>
                <div className="stat-value">${stats.earnings?.toFixed?.(2) ?? stats.earnings}</div>
                <div className="stat-change up">+{((stats.commissionRate ?? 0.30) * 100).toFixed(0)}% comisión</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Aceptación %</div>
                <div className="stat-value">{stats.acceptanceRate ?? 0}%</div>
                <div className="stat-change up">Tasa de aceptación</div>
              </div>
            </div>
          )}

          <div style={{ padding: '0 24px 20px' }}>
            <div className="filter-tabs">
              {(['pending', 'active', 'history'] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`filter-tab${activeTab === tab ? ' active' : ''}`}
                >
                  {tabLabels[tab]}
                  <span className="count">{tabCounts[tab]}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            <div className="table-wrap">
              {filteredAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--fg-muted)' }}>
                  No hay asignaciones {tabLabels[activeTab].toLowerCase()}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredAssignments.map(a => {
                    const statusInfo = STATUS_MAP[a.status] || { label: a.status, className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' }
                    return (
                      <div key={a.id} className="card" style={{ padding: 16 }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>#{a.order_number || a.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                            {['pending_acceptance', 'offered'].includes(a.status) && (
                              <div className="action-btn-group">
                                <button
                                  onClick={() => handleAction(a.id, 'accept')}
                                  disabled={actionLoading === a.id}
                                  className="action-btn view"
                                  title="Aceptar"
                                  style={{ fontSize: 12, width: 'auto', padding: '4px 10px' }}
                                >
                                  {actionLoading === a.id ? '...' : 'Aceptar'}
                                </button>
                                <button
                                  onClick={() => handleAction(a.id, 'decline')}
                                  disabled={actionLoading === a.id}
                                  className="action-btn danger"
                                  title="Rechazar"
                                  style={{ fontSize: 12, width: 'auto', padding: '4px 10px' }}
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2" style={{ fontSize: 13, marginTop: 8 }}>
                          {a.customer_name && <div><span style={{ color: 'var(--fg-muted)' }}>Cliente:</span> {a.customer_name}</div>}
                          {a.customer_phone && <div><span style={{ color: 'var(--fg-muted)' }}>Teléfono:</span> {a.customer_phone}</div>}
                          {a.flight_number && <div><span style={{ color: 'var(--fg-muted)' }}>Vuelo:</span> {a.airline} {a.flight_number}</div>}
                          {a.arrival_date && <div><span style={{ color: 'var(--fg-muted)' }}>Llegada:</span> {a.arrival_date} {a.arrival_time}</div>}
                          {a.destination_address && <div className="col-span-2"><span style={{ color: 'var(--fg-muted)' }}>Destino:</span> {a.destination_address}</div>}
                          {a.package_name && <div><span style={{ color: 'var(--fg-muted)' }}>Paquete:</span> {a.package_name}</div>}
                        </div>
                        {a.observations && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Notas: {a.observations}</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input" />
    </div>
  )
}
