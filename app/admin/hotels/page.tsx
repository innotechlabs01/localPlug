'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminFetch } from '@/lib/admin/admin-fetch'
import { useToast } from '@/lib/admin/toast-context'

interface Hotel {
  id: number; name: string; slug: string; address: string
  phone: string; email: string; status: string
  commission_rate: number; room_count: number
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function HotelsPage() {
  const { showToast } = useToast()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editHotel, setEditHotel] = useState<Hotel | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const fetchHotels = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/hotels')
      if (res.ok) {
        const data = await res.json()
        setHotels(data.hotels || [])
      }
    } catch (e) { console.error('Failed to fetch hotels', e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchHotels() }, [fetchHotels])

  const openCreate = () => {
    setEditHotel(null)
    setForm({ name: '', address: '', email: '', phone: '', commission_rate: '10', manager_name: '', manager_email: '', manager_password: generatePassword() })
    setCreatedCredentials(null)
    setModalOpen(true)
  }

  const openEdit = (h: Hotel) => {
    setEditHotel(h)
    setForm({
      name: h.name, address: h.address || '', email: h.email || '',
      phone: h.phone || '', commission_rate: String(Math.round((Number(h.commission_rate) || 0) * 100)),
    })
    setModalOpen(true)
  }

  const save = async () => {
    try {
      if (editHotel) {
        const res = await adminFetch('/api/admin/hotels', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editHotel.id,
            name: form.name,
            address: form.address,
            email: form.email,
            phone: form.phone,
            commission_rate: (Number(form.commission_rate) || 0) / 100,
          }),
        })
        if (res.ok) {
          showToast('Hotel actualizado')
          setModalOpen(false)
          fetchHotels()
        } else {
          const err = await res.json()
          showToast(err.error || 'Error al guardar')
        }
      } else {
        if (!form.name?.trim()) { showToast('El nombre del hotel es obligatorio'); return }
        if (!form.manager_name?.trim()) { showToast('El nombre del gerente es obligatorio'); return }
        if (!form.manager_email?.trim()) { showToast('El email del gerente es obligatorio'); return }
        if (!form.manager_password?.trim()) { showToast('La contraseña es obligatoria'); return }

        const res = await adminFetch('/api/admin/hotels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            address: form.address,
            email: form.email,
            phone: form.phone,
            commission_rate: (Number(form.commission_rate) || 0) / 100,
            manager_name: form.manager_name,
            manager_email: form.manager_email,
            manager_password: form.manager_password,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.manager) {
            setCreatedCredentials({ email: data.manager.email, password: data.manager.temporaryPassword })
          } else {
            showToast('Hotel creado')
            setModalOpen(false)
          }
          fetchHotels()
        } else {
          const err = await res.json()
          showToast(err.error || 'Error al crear hotel')
        }
      }
    } catch { showToast('Error de conexión') }
  }

  const deleteHotel = async (id: number) => {
    const res = await adminFetch(`/api/admin/hotels?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Hotel eliminado')
      setDeleteConfirm(null)
      fetchHotels()
    } else {
      showToast('Error al eliminar hotel')
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-empty" style={{ padding: '48px 24px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <h3>Cargando hoteles...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page space-y-6">
      <section className="admin-section-header">
        <div>
          <h1 className="admin-page-title">Hoteles</h1>
          <p className="admin-section-desc">Gestiona los hoteles aliados, habitaciones y comisiones de la plataforma.</p>
        </div>
        <button onClick={openCreate} className="admin-btn admin-btn-primary admin-btn-sm">
          + Crear Hotel
        </button>
      </section>

      <ReservationKPIsPlaceholder
        items={[
          ['Total Hoteles', String(hotels.length), 'Todos los hoteles'],
          ['Activos', String(hotels.filter(h => h.status === 'active').length), 'Aceptando reservas'],
          ['Total Habitaciones', String(hotels.reduce((s, h) => s + (h.room_count || 0), 0)), 'Todas las propiedades'],
          ['Comisión Promedio', `${hotels.length ? Math.round(hotels.reduce((s, h) => s + (Number(h.commission_rate) || 0) * 100, 0) / hotels.length) : 0}%`, 'Tasa de plataforma'],
        ]}
      />

      <section className="admin-card admin-mt-4">
        <div className="admin-card-header admin-flex-between">
          <span className="admin-card-title">Directorio de Hoteles</span>
          <span className="admin-badge neutral">{hotels.length} hoteles</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hotel</th>
                  <th>Dirección</th>
                  <th>Contacto</th>
                  <th>Comisión</th>
                  <th>Habitaciones</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {hotels.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ui-fg-muted)' }}>
                      No hay hoteles. Haz clic en «Crear Hotel» para agregar el primero.
                    </td>
                  </tr>
                ) : hotels.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div className="flex items-center gap-8">
                        <div className="admin-guest-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--ui-accent), var(--ui-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>
                          {h.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ui-fg)' }}>{h.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{h.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ui-fg-muted)', fontSize: 13 }}>{h.address || '—'}</td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{h.email || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--ui-fg-muted)' }}>{h.phone || ''}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{Math.round((Number(h.commission_rate) || 0) * 100)}%</td>
                    <td style={{ fontSize: 13, color: 'var(--ui-fg)' }}>{h.room_count || 0}</td>
                    <td>
                      <span className={`admin-badge ${h.status === 'active' ? 'accent' : 'neutral'}`}>
                        {h.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="admin-flex-between" style={{ justifyContent: 'center' }}>
                        <button
                          onClick={() => openEdit(h)}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="Editar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(h.id)}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="Eliminar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <div className="admin-modal-overlay open" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Eliminar Hotel</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setDeleteConfirm(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 13, color: 'var(--ui-fg-muted)' }}>
                ¿Estás seguro de eliminar este hotel y todas sus habitaciones? Esta acción no se puede deshacer.
              </p>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => deleteHotel(deleteConfirm)}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editHotel ? 'Editar Hotel' : 'Nuevo Hotel'}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="admin-modal-body">
              {createdCredentials ? (
                <div className="admin-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.124"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <h3>¡Hotel Creado!</h3>
                  <p className="admin-section-desc" style={{ maxWidth: 'none' }}>Comparte estas credenciales con el gerente:</p>
                  <div className="admin-card" style={{ padding: 16, background: 'var(--ui-bg-secondary)', border: '1px solid var(--ui-border-light)' }}>
                    <div className="admin-field">
                      <label className="admin-field-label">Email</label>
                      <div style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ui-fg)' }}>{createdCredentials.email}</div>
                    </div>
                    <div className="admin-field">
                      <label className="admin-field-label">Contraseña Temporal</label>
                      <div style={{ fontFamily: 'var(--ui-font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ui-fg)' }}>{createdCredentials.password}</div>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--ui-fg-muted)', marginTop: 12 }}>
                      El gerente puede cambiar su contraseña después del primer inicio de sesión.
                    </p>
                    <div className="admin-flex-between" style={{ marginTop: 16 }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nContraseña: ${createdCredentials.password}`)
                          showToast('Credenciales copiadas')
                        }}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Copiar Credenciales
                      </button>
                      <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setModalOpen(false)}>Listo</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="admin-field">
                    <label className="admin-field-label">Nombre del Hotel *</label>
                    <input
                      className="admin-input"
                      value={form.name || ''}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="ej. Hotel Estelar"
                    />
                  </div>
                  <div className="admin-field">
                    <label className="admin-field-label">Dirección</label>
                    <input
                      className="admin-input"
                      value={form.address || ''}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Calle, Ciudad, País"
                    />
                  </div>
                  <div className="admin-grid-2">
                    <div className="admin-field">
                      <label className="admin-field-label">Email</label>
                      <input
                        className="admin-input"
                        type="email"
                        value={form.email || ''}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="info@hotel.com"
                      />
                    </div>
                    <div className="admin-field">
                      <label className="admin-field-label">Teléfono</label>
                      <input
                        className="admin-input"
                        value={form.phone || ''}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                  </div>
                  <div className="admin-field">
                    <label className="admin-field-label">Comisión (%)</label>
                    <input
                      className="admin-input"
                      type="number"
                      min="0"
                      max="100"
                      value={form.commission_rate || ''}
                      onChange={e => setForm(p => ({ ...p, commission_rate: e.target.value }))}
                      placeholder="10"
                    />
                  </div>

                  {!editHotel && (
                    <div className="admin-mt-4" style={{ paddingTop: 16, borderTop: '1px solid var(--ui-border-light)' }}>
                      <div className="admin-section-title admin-section-desc" style={{ fontSize: 13, marginBottom: 12 }}>Cuenta del Gerente</div>
                      <div className="admin-field">
                        <label className="admin-field-label">Nombre completo *</label>
                        <input
                          className="admin-input"
                          value={form.manager_name || ''}
                          onChange={e => setForm(p => ({ ...p, manager_name: e.target.value }))}
                          placeholder="ej. Juan Pérez"
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-field-label">Email (Login) *</label>
                        <input
                          className="admin-input"
                          type="email"
                          value={form.manager_email || ''}
                          onChange={e => setForm(p => ({ ...p, manager_email: e.target.value }))}
                          placeholder="gerente@hotel.com"
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-field-label">Contraseña Temporal *</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            className="admin-input flex-1 font-mono"
                            value={form.manager_password || ''}
                            onChange={e => setForm(p => ({ ...p, manager_password: e.target.value }))}
                            placeholder="Mín. 8 caracteres"
                          />
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => setForm(p => ({ ...p, manager_password: generatePassword() }))}
                          >
                            Regenerar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="admin-modal-footer" style={{ marginTop: 20 }}>
                    <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setModalOpen(false)}>Cancelar</button>
                    <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={save}>
                      {editHotel ? 'Guardar Cambios' : 'Crear Hotel'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReservationKPIsPlaceholder({ items }: { items: [string, string, string][] }) {
  return (
    <div className="admin-grid-4 admin-mt-4">
      {items.map(([label, value, sub], idx) => (
        <div key={idx} className="admin-kpi-card">
          <div className="admin-kpi-label">{label}</div>
          <div className="admin-kpi-value">{value}</div>
          <div className="admin-kpi-sub neutral">{sub}</div>
        </div>
      ))}
    </div>
  )
}
