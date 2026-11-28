'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEventStream } from '@/lib/use-event-stream'

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
  tripCompensation: number
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
  order_status: string | null
  order_dispatch_status: string | null
}

type Tab = 'pending' | 'active' | 'history'

const STATUS_STYLES: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  pending: { label: 'Pendiente', bg: 'var(--ui-warning-soft)', fg: 'var(--ui-warning)', border: 'rgba(250, 204, 21, 0.25)' },
  pending_acceptance: { label: 'Pendiente aceptación', bg: 'var(--ui-warning-soft)', fg: 'var(--ui-warning)', border: 'rgba(250, 204, 21, 0.25)' },
  offered: { label: 'Ofrecido', bg: 'var(--ui-info-soft)', fg: 'var(--ui-info)', border: 'rgba(96, 165, 250, 0.25)' },
  accepted: { label: 'Aceptado', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)', border: 'rgba(74, 222, 128, 0.25)' },
  confirmed: { label: 'Confirmado', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)', border: 'rgba(74, 222, 128, 0.25)' },
  confirmed_to_client: { label: 'Confirmada', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)', border: 'rgba(74, 222, 128, 0.25)' },
  en_route: { label: 'En camino', bg: 'var(--ui-info-soft)', fg: 'var(--ui-info)', border: 'rgba(96, 165, 250, 0.25)' },
  in_progress: { label: 'En progreso', bg: 'var(--ui-accent-soft)', fg: 'var(--ui-accent)', border: 'rgba(74, 222, 128, 0.25)' },
  completed: { label: 'Completado', bg: 'rgba(100, 100, 100, 0.12)', fg: 'var(--ui-fg-secondary)', border: 'rgba(100, 100, 100, 0.25)' },
  cancelled: { label: 'Cancelado', bg: 'var(--ui-danger-soft)', fg: 'var(--ui-danger)', border: 'rgba(248, 113, 113, 0.25)' },
  expired: { label: 'Expirado', bg: 'var(--ui-danger-soft)', fg: 'var(--ui-danger)', border: 'rgba(248, 113, 113, 0.25)' },
  declined: { label: 'Rechazado', bg: 'var(--ui-danger-soft)', fg: 'var(--ui-danger)', border: 'rgba(248, 113, 113, 0.25)' },
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
  const [isOnline, setIsOnline] = useState(false)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 6.2088, lng: -75.567 })
  const [gpsStatus, setGpsStatus] = useState<string>('')
  const [panicConfirm, setPanicConfirm] = useState(false)
  const [panicSent, setPanicSent] = useState(false)

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
        setIsOnline(d.status === 'available' || d.status === 'on_route')
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

  // Realtime push — new assignment / trip progress refreshes the driver home.
  useEventStream({
    'driver.assignment_offered': () => { fetchAssignments() },
    'assignments.accepted': () => { fetchAssignments() },
    'assignments.declined': () => { fetchAssignments() },
    'driver.en_route': () => { fetchAssignments() },
    'trip.pickedup': () => { fetchAssignments() },
    'driver.trip_completed': () => { fetchAssignments() },
  }, { pollMs: 10000 })

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

  // Live GPS tracking while driver is ONLINE (Uber Driver mode)
  useEffect(() => {
    if (!isOnline || typeof window === 'undefined' || !('geolocation' in navigator)) return
    let lastSent = 0
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        setGpsStatus('GPS en vivo')
        const now = Date.now()
        if (now - lastSent < 8000) return
        lastSent = now
        fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lng,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
          }),
        }).catch(() => {})
      },
      (err) => {
        setGpsStatus(err.code === 1 ? 'Permiso GPS denegado' : 'Buscando señal GPS...')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [isOnline])

  const handleToggleOnline = async () => {
    if (togglingOnline) return
    setTogglingOnline(true)
    try {
      const nextOnline = !isOnline
      const res = await fetch('/api/driver/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextOnline ? 'available' : 'inactive' }),
      })
      if (res.ok) {
        setIsOnline(nextOnline)
        if (!nextOnline) {
          setGpsStatus('')
          fetch('/api/driver/location', { method: 'DELETE' }).catch(() => {})
        }
      }
    } catch {
      // ignore
    } finally {
      setTogglingOnline(false)
    }
  }

  const isLicenseExpired = Boolean(
    driver?.license_expiry && new Date(driver.license_expiry).getTime() < Date.now(),
  )

  const isOfferCancelled = (a: Assignment) =>
    ['cancelled', 'completed'].includes(a.order_status || '') ||
    ['cancelled', 'completed'].includes(a.order_dispatch_status || '')

  const isPendingOffer = (a: Assignment) =>
    ['pending_acceptance', 'offered'].includes(a.status) && !isOfferCancelled(a)

  const pendingOffer = assignments.find(isPendingOffer) || null
  const activeTrip = assignments.find(a => ['accepted', 'confirmed', 'confirmed_to_client', 'en_route', 'in_progress'].includes(a.status)) || null

  const handlePanicTrigger = async () => {
    if (!panicConfirm) {
      setPanicConfirm(true)
      setTimeout(() => setPanicConfirm(false), 6000)
      return
    }
    try {
      const res = await fetch('/api/driver/panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeTrip?.order_id || null,
          lat: coords.lat,
          lng: coords.lng,
          note: `Alerta SOS activada en viaje ${activeTrip?.booking_reference || ''}`,
        }),
      })
      if (res.ok) {
        setPanicSent(true)
        setPanicConfirm(false)
      }
    } catch { /* ignore */ }
  }

  const handleAction = async (assignmentId: number, action: 'accept' | 'decline') => {
    setActionLoading(assignmentId)
    try {
      const endpoint = action === 'accept'
        ? `/api/assignments/${assignmentId}/accept`
        : `/api/assignments/${assignmentId}/decline`
      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) {
        console.error(`Failed to ${action}`)
        return
      }
      await fetchAssignments()
      fetchMetrics()
    } catch (err) {
      console.error(`Failed to ${action}`, err)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'pending') return isPendingOffer(a)
    if (activeTab === 'active') return ['accepted', 'confirmed', 'confirmed_to_client', 'en_route', 'in_progress'].includes(a.status)
    return ['declined', 'completed', 'cancelled', 'expired'].includes(a.status)
  })

  const tabCounts = {
    pending: assignments.filter(isPendingOffer).length,
    active: assignments.filter(a => ['accepted', 'confirmed', 'confirmed_to_client', 'en_route', 'in_progress'].includes(a.status)).length,
    history: assignments.filter(a => ['declined', 'completed', 'cancelled', 'expired'].includes(a.status)).length,
  }

  const tabLabels: Record<Tab, string> = {
    pending: 'Pendientes',
    active: 'Activas',
    history: 'Historial',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent-gold)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    const isNotFound = error === 'driver_not_found'
    return (
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 18, marginBottom: 16, color: isNotFound ? 'var(--warning)' : 'var(--danger)' }}>
            {isNotFound
              ? 'No se encontró tu perfil de conductor. Contacte al administrador para que te registre.'
              : error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              background: 'var(--accent-gold)', color: 'var(--bg-dark)',
              border: 'none', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-gold-light, #e8c9a0)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-gold)' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!driver) return null

  const needsProfile = !driver.profile_complete || editMode

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 0 24px',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
            color: 'var(--text-primary)', margin: 0,
          }}>
            Dashboard — {driver.name}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Panel de conductor</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {driver.profile_complete && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8,
                background: 'transparent', color: 'var(--fg)',
                border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover, rgba(255,255,255,0.05))'
                e.currentTarget.style.borderColor = 'var(--fg-muted)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar Perfil
            </button>
          )}
        </div>
      </div>

      {needsProfile ? (
        <div style={{ padding: '0 0 24px' }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            padding: 24,
            transition: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent-gold)', marginBottom: 16 }}>
              {driver.profile_complete ? 'Editar Perfil' : 'Completa Tu Perfil'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Completa los datos de tu vehículo y licencia para comenzar a recibir asignaciones.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <Input label="Nombre completo *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <Input label="Teléfono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
              <Input label="Ciudad" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Vehículo *" value={form.vehicle} onChange={v => setForm(f => ({ ...f, vehicle: v }))} />
              <Input label="Placa *" value={form.plate} onChange={v => setForm(f => ({ ...f, plate: v }))} />

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', display: 'block', marginBottom: 6 }}>Categoría</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--fg)',
                    fontSize: 13.5, fontFamily: 'var(--font-sans)',
                    outline: 'none', cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <option value="standard">Estándar</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', display: 'block', marginBottom: 6 }}>Idiomas</label>
                <select
                  value={form.languages}
                  onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--fg)',
                    fontSize: 13.5, fontFamily: 'var(--font-sans)',
                    outline: 'none', cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <option value="Spanish">Español</option>
                  <option value="English">Inglés</option>
                  <option value="Spanish, English">Español e Inglés</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', display: 'block', marginBottom: 6 }}>Experiencia</label>
                <select
                  value={form.experience_level}
                  onChange={e => setForm(f => ({ ...f, experience_level: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--fg)',
                    fontSize: 13.5, fontFamily: 'var(--font-sans)',
                    outline: 'none', cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <option value="Standard">Estándar</option>
                  <option value="Experienced">Experimentado</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <Input label="Número de licencia" value={form.license_number} onChange={v => setForm(f => ({ ...f, license_number: v }))} />
              <Input label="Vencimiento de licencia" value={form.license_expiry} onChange={v => setForm(f => ({ ...f, license_expiry: v }))} type="date" />
              <Input label="Cuenta bancaria" value={form.bank_account} onChange={v => setForm(f => ({ ...f, bank_account: v }))} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                <input
                  type="checkbox"
                  id="vip"
                  checked={form.vip_compatible}
                  onChange={e => setForm(f => ({ ...f, vip_compatible: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                />
                <label htmlFor="vip" style={{ fontSize: 13, color: 'var(--fg-secondary)', cursor: 'pointer' }}>Compatible VIP</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.vehicle || !form.plate}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 8,
                  background: 'var(--accent-gold)', color: 'var(--bg-dark)',
                  border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = 'var(--accent-gold-light, #e8c9a0)' }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = 'var(--accent-gold)' }}
              >
                {saving ? 'Guardando...' : driver.profile_complete ? 'Guardar Cambios' : 'Completar Perfil'}
              </button>
              {editMode && (
                <button
                  onClick={() => setEditMode(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 8,
                    background: 'transparent', color: 'var(--fg)',
                    border: '1px solid var(--border)',
                    fontSize: 14, fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-hover, rgba(255,255,255,0.05))'
                    e.currentTarget.style.borderColor = 'var(--fg-muted)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── UBER DRIVER LIVE MAP HERO ── */}
          <div style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            height: 440,
            marginBottom: 24,
            background: 'var(--bg-secondary)',
          }}>
            <iframe
              title="Uber Driver Live Map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${(coords.lng - 0.025).toFixed(5)},${(coords.lat - 0.025).toFixed(5)},${(coords.lng + 0.025).toFixed(5)},${(coords.lat + 0.025).toFixed(5)}&layer=mapnik&marker=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`}
              style={{ width: '100%', height: '100%', border: 0 }}
              loading="lazy"
            />

            {/* Top floating status bar */}
            <div style={{
              position: 'absolute',
              top: 14,
              left: 14,
              right: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              pointerEvents: 'none',
            }}>
              <div style={{
                pointerEvents: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(11, 13, 20, 0.88)',
                border: `1px solid ${isOnline ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'}`,
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 600,
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: isOnline ? '#10b981' : '#9ca3af',
                  boxShadow: isOnline ? '0 0 10px #10b981' : 'none',
                }} />
                {isOnline ? (gpsStatus || 'EN LÍNEA · Listo para servicios') : 'DESCONECTADO'}
              </div>
              {stats && (
                <div style={{
                  pointerEvents: 'auto',
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'rgba(11, 13, 20, 0.88)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#4ade80',
                  fontSize: 13,
                  fontWeight: 700,
                  backdropFilter: 'blur(8px)',
                }}>
                  ${Number(stats.earnings || 0).toFixed(0)}
                </div>
              )}
            </div>

            {/* Incoming Service Offer Bottom Sheet (Uber-style) */}
            {isOnline && pendingOffer ? (
              <div style={{
                position: 'absolute',
                left: 14,
                right: 14,
                bottom: 14,
                padding: 16,
                borderRadius: 14,
                background: 'rgba(17, 19, 24, 0.96)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
                color: '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
                    color: (pendingOffer.package_name || '').toLowerCase().includes('on-demand') ? '#10b981' : '#d4a84b',
                  }}>
                    {(pendingOffer.package_name || '').toLowerCase().includes('on-demand')
                      ? '🚗 VIAJE ON-DEMAND'
                      : '✈️ SERVICIO DE AEROPUERTO'}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca0b0' }}>
                    {pendingOffer.booking_reference || `#${pendingOffer.order_id}`}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {pendingOffer.customer_name || 'Pasajero'} · {pendingOffer.package_name || 'Traslado'}
                </div>
                <div style={{ fontSize: 12.5, color: '#9ca0b0', marginBottom: 12, lineHeight: 1.45 }}>
                  <div>📍 Destino: <strong style={{ color: '#f0f2f5' }}>{pendingOffer.destination_address || 'Aeropuerto JMC / Medellín'}</strong></div>
                  {pendingOffer.observations && (
                    <div style={{ fontSize: 11.5, color: '#cbd5e1', marginTop: 2 }}>{pendingOffer.observations}</div>
                  )}
                  {pendingOffer.flight_number && (
                    <div style={{ fontSize: 11.5, color: '#d4a84b', marginTop: 2 }}>✈️ Vuelo {pendingOffer.flight_number}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleAction(pendingOffer.id, 'accept')}
                    disabled={actionLoading === pendingOffer.id}
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#10b981',
                      color: '#0b0d14',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {actionLoading === pendingOffer.id ? 'Aceptando...' : 'Aceptar Servicio'}
                  </button>
                  <button
                    onClick={() => handleAction(pendingOffer.id, 'decline')}
                    disabled={actionLoading === pendingOffer.id}
                    style={{
                      padding: '11px 16px',
                      borderRadius: 10,
                      border: '1px solid rgba(239,68,80,0.5)',
                      background: 'rgba(239,68,80,0.12)',
                      color: '#ef4450',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ) : activeTrip ? (
              /* Active Trip 1-Thumb Progression Sheet */
              <div style={{
                position: 'absolute',
                left: 14,
                right: 14,
                bottom: 14,
                padding: 16,
                borderRadius: 14,
                background: 'rgba(17, 19, 24, 0.96)',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
                color: '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#60a5fa' }}>
                    ● Viaje Activo ({activeTrip.status})
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeTrip.destination_address || 'Medellín')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 600, color: '#10b981', textDecoration: 'none' }}
                  >
                    Navegar ↗
                  </a>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                  {activeTrip.customer_name || 'Pasajero'} · {activeTrip.package_name || 'Servicio'}
                </div>
                <div style={{ fontSize: 12, color: '#9ca0b0', marginBottom: 12 }}>
                  📍 {activeTrip.destination_address || 'Destino confirmado'}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href="/driver/assignments"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 48,
                      borderRadius: 10,
                      background: '#3b82f6',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: 'none',
                    }}
                  >
                    Gestionar Recorrido →
                  </a>
                  <button
                    onClick={handlePanicTrigger}
                    disabled={panicSent}
                    style={{
                      padding: '0 16px',
                      height: 48,
                      borderRadius: 10,
                      border: '2px solid #ef4450',
                      background: panicSent ? '#7f1d1d' : panicConfirm ? '#ef4450' : 'rgba(239,68,80,0.18)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: panicSent ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {panicSent ? 'SOS ENVIADO' : panicConfirm ? '¿CONFIRMAR SOS?' : '🚨 PÁNICO'}
                  </button>
                </div>
              </div>
            ) : (
              /* Central Uber-style INICIAR / STOP button (blocked if license expired) */
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                pointerEvents: 'none',
              }}>
                {isLicenseExpired && (
                  <div style={{
                    pointerEvents: 'auto',
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'rgba(239,68,80,0.92)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    Licencia vencida — actualiza tus documentos en Configuración para iniciar
                  </div>
                )}
                <button
                  onClick={handleToggleOnline}
                  disabled={togglingOnline || isLicenseExpired}
                  style={{
                    pointerEvents: 'auto',
                    minWidth: 168,
                    padding: '14px 32px',
                    borderRadius: 999,
                    border: `2px solid ${isLicenseExpired ? '#646880' : isOnline ? '#ef4450' : '#10b981'}`,
                    background: isLicenseExpired ? '#282b38' : isOnline ? '#ef4450' : '#10b981',
                    color: isLicenseExpired ? '#9ca0b0' : isOnline ? '#fff' : '#0b0d14',
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    boxShadow: isLicenseExpired ? 'none' : isOnline ? '0 8px 28px rgba(239,68,80,0.45)' : '0 8px 28px rgba(16,185,129,0.45)',
                    cursor: (togglingOnline || isLicenseExpired) ? 'not-allowed' : 'pointer',
                    transition: 'transform 150ms ease',
                  }}
                >
                  {togglingOnline ? '...' : isOnline ? '■ STOP' : '▶ INICIAR'}
                </button>
              </div>
            )}
          </div>

          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              marginBottom: 24,
            }}>
              {[
                { label: 'Viajes totales', value: stats.total, sub: null, color: 'var(--accent-gold)' },
                { label: 'Completados', value: stats.completed, sub: `+${stats.completed}`, color: 'var(--accent-gold)' },
                { label: 'Pendientes', value: stats.pending, sub: `${stats.pending} activos`, color: 'var(--accent-gold)' },
                { label: 'Activos', value: stats.active, sub: 'En curso', color: 'var(--accent-gold)' },
                { label: 'Ganancias', value: `$${stats.earnings?.toFixed?.(2) ?? stats.earnings}`, sub: `+${(stats.tripCompensation ?? 0).toFixed(2)} USD / trayecto`, color: 'var(--accent-gold)' },
                { label: 'Aceptación %', value: `${stats.acceptanceRate ?? 0}%`, sub: 'Tasa de aceptación', color: 'var(--accent-gold)' },
              ].map((kpi, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 16px',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = kpi.color
                    e.currentTarget.style.boxShadow = '0 0 0 1px rgba(212, 168, 75, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 2.5, background: kpi.color,
                  }} />
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {kpi.value}
                  </div>
                  {kpi.sub && (
                    <div style={{ fontSize: 12, fontWeight: 500, marginTop: 6, color: 'var(--accent)' }}>
                      {kpi.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {(['pending', 'active', 'history'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px', borderRadius: 12,
                  fontSize: 12, fontWeight: 500,
                  background: activeTab === tab ? 'rgba(212, 168, 75, 0.12)' : 'transparent',
                  color: activeTab === tab ? 'var(--accent-gold)' : 'var(--fg-muted)',
                  border: `1px solid ${activeTab === tab ? 'var(--accent-gold)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.borderColor = 'var(--fg-muted)'
                    e.currentTarget.style.color = 'var(--fg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--fg-muted)'
                  }
                }}
              >
                {tabLabels[tab]}
                <span style={{ marginLeft: 8, opacity: 0.6 }}>{tabCounts[tab]}</span>
              </button>
            ))}
          </div>

          <div>
            {filteredAssignments.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
                color: 'var(--fg-muted)',
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.3 }}>
                  <rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <p style={{ fontSize: 14, margin: 0 }}>No hay asignaciones {tabLabels[activeTab].toLowerCase()}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredAssignments.map(a => {
                  const statusInfo = STATUS_STYLES[a.status] || { label: a.status, bg: 'rgba(100,100,100,0.12)', fg: 'var(--ui-fg-secondary)', border: 'rgba(100,100,100,0.25)' }
                  return (
                    <div
                      key={a.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-card)',
                        padding: 16,
                        transition: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-elevated)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px',
                            borderRadius: 8, fontSize: 11, fontWeight: 500,
                            background: statusInfo.bg, color: statusInfo.fg,
                            border: `1px solid ${statusInfo.border}`,
                            whiteSpace: 'nowrap',
                          }}>
                            {statusInfo.label}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>#{a.order_number || a.id}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                          {['pending_acceptance', 'offered'].includes(a.status) && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => handleAction(a.id, 'accept')}
                                disabled={actionLoading === a.id}
                                style={{
                                  padding: '5px 12px', borderRadius: 6,
                                  fontSize: 12, fontWeight: 500,
                                  background: 'var(--ui-accent)', color: 'var(--ui-bg)',
                                  border: 'none', cursor: 'pointer',
                                  opacity: actionLoading === a.id ? 0.5 : 1,
                                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                onMouseEnter={(e) => { if (actionLoading !== a.id) e.currentTarget.style.background = 'var(--ui-accent)' }}
                                onMouseLeave={(e) => { if (actionLoading !== a.id) e.currentTarget.style.background = 'var(--ui-accent)' }}
                              >
                                {actionLoading === a.id ? '...' : 'Aceptar'}
                              </button>
                              <button
                                onClick={() => handleAction(a.id, 'decline')}
                                disabled={actionLoading === a.id}
                                style={{
                                  padding: '5px 12px', borderRadius: 6,
                                  fontSize: 12, fontWeight: 500,
                                  background: 'var(--ui-danger-soft)',
                                  color: 'var(--ui-danger)',
                                  border: '1px solid var(--ui-danger-soft)',
                                  cursor: 'pointer',
                                  opacity: actionLoading === a.id ? 0.5 : 1,
                                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                onMouseEnter={(e) => { if (actionLoading !== a.id) e.currentTarget.style.background = 'rgba(248, 113, 113, 0.18)' }}
                                onMouseLeave={(e) => { if (actionLoading !== a.id) e.currentTarget.style.background = 'var(--danger-soft, rgba(248, 113, 113, 0.12))' }}
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, marginTop: 10 }}>
                        {a.customer_name && <div><span style={{ color: 'var(--fg-muted)' }}>Cliente:</span> {a.customer_name}</div>}
                        {a.customer_phone && <div><span style={{ color: 'var(--fg-muted)' }}>Teléfono:</span> {a.customer_phone}</div>}
                        {a.flight_number && <div><span style={{ color: 'var(--fg-muted)' }}>Vuelo:</span> {a.airline} {a.flight_number}</div>}
                        {a.arrival_date && <div><span style={{ color: 'var(--fg-muted)' }}>Llegada:</span> {a.arrival_date} {a.arrival_time}</div>}
                        {a.destination_address && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--fg-muted)' }}>Destino:</span> {a.destination_address}</div>}
                        {a.package_name && <div><span style={{ color: 'var(--fg-muted)' }}>Paquete:</span> {a.package_name}</div>}
                      </div>
                      {a.observations && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--fg-muted)', fontStyle: 'italic' }}>Notas: {a.observations}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'var(--bg)',
          border: `1px solid ${focused ? 'var(--accent-gold)' : 'var(--border)'}`,
          borderRadius: 8,
          color: 'var(--fg)',
          fontFamily: 'var(--font-sans)',
          fontSize: 13.5,
          outline: 'none',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: focused ? '0 0 0 3px rgba(212, 168, 75, 0.12)' : 'none',
        }}
      />
    </div>
  )
}
