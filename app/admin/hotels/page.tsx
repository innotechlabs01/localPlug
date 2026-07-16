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
      <div className="flex items-center justify-center h-64">
        <div className="text-fg-muted">Cargando hoteles...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div className="drivers-hero">
        <div>
          <h1 className="text-[24px] font-bold tracking-tighter text-fg">Hoteles</h1>
          <p className="mt-2 text-[13px] text-fg-muted max-w-[760px] leading-[1.55]">
            Gestiona los hoteles aliados, habitaciones y comisiones de la plataforma.
          </p>
        </div>
        <div className="drivers-toolbar flex items-center gap-2.5 flex-wrap">
          <button
            className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-md hover:bg-[#059669] transition-all"
            onClick={openCreate}
          >
            + Crear Hotel
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="drivers-kpis grid-6">
        {[
          ['Total Hoteles', String(hotels.length), 'Todos los hoteles', true],
          ['Activos', String(hotels.filter(h => h.status === 'active').length), 'Aceptando reservas', true],
          ['Total Habitaciones', String(hotels.reduce((s, h) => s + (h.room_count || 0), 0)), 'Todas las propiedades', true],
          ['Comisión Promedio', `${hotels.length ? Math.round(hotels.reduce((s, h) => s + (Number(h.commission_rate) || 0) * 100, 0) / hotels.length) : 0}%`, 'Tasa de plataforma', false],
        ].map(([label, value, sub, positive], idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            <div className={`stat-change ${positive ? 'up' : 'down'}`}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <span>Directorio de Hoteles</span>
            <span className="count">{hotels.length} hoteles</span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hotel</th>
                <th>Dirección</th>
                <th>Contacto</th>
                <th>Comisión</th>
                <th>Habitaciones</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {hotels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-fg-muted text-center py-8">
                    No hay hoteles. Haz clic en &ldquo;+ Crear Hotel&rdquo; para agregar el primero.
                  </td>
                </tr>
              ) : hotels.map(h => (
                <tr key={h.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-[13px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, var(--accent), #059669)' }}
                      >
                        {h.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-fg">{h.name}</div>
                        <div className="text-[11px] text-fg-muted">{h.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-[13px] text-fg-muted">{h.address || '—'}</td>
                  <td>
                    <div className="text-[13px] text-fg">{h.email || '—'}</div>
                    <div className="text-[11px] text-fg-muted">{h.phone || ''}</div>
                  </td>
                  <td className="text-[13px] text-fg">{Math.round((Number(h.commission_rate) || 0) * 100)}%</td>
                  <td className="text-[13px] text-fg">{h.room_count || 0}</td>
                  <td>
                    <span className={h.status === 'active' ? 'badge badge-accent' : 'badge'}>
                      {h.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btn-group">
                      <button className="action-btn view" onClick={() => openEdit(h)} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button className="action-btn more" onClick={() => setDeleteConfirm(h.id)} title="Eliminar">
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

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <div className="modal-overlay open" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Eliminar Hotel</h2>
              <button className="icon-btn" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-[13px] text-fg-muted">
                ¿Estás seguro de eliminar este hotel y todas sus habitaciones? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                <button
                  className="btn btn-primary"
                  style={{ background: '#ef4444' }}
                  onClick={() => deleteHotel(deleteConfirm)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay open" onClick={() => setModalOpen(false)}>
          <div className="modal max-w-[600px]" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editHotel ? 'Editar Hotel' : 'Nuevo Hotel'}</h2>
              <button className="icon-btn" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {createdCredentials ? (
                <div className="text-center py-4">
                  <h3 className="text-[16px] font-bold text-fg mb-2">¡Hotel Creado!</h3>
                  <p className="text-[13px] text-fg-muted mb-4">Comparte estas credenciales con el gerente:</p>
                  <div className="p-4 rounded-lg mb-4" style={{ background: '#0d0d14', border: '1px solid #2a2a3e' }}>
                    <div className="text-[12px] text-fg-muted mb-1">Email</div>
                    <div className="text-[14px] font-mono font-medium text-white mb-3">{createdCredentials.email}</div>
                    <div className="text-[12px] text-fg-muted mb-1">Contraseña Temporal</div>
                    <div className="text-[14px] font-mono font-medium text-white">{createdCredentials.password}</div>
                  </div>
                  <p className="text-[11px] text-fg-muted mb-4">
                    El gerente puede cambiar su contraseña después del primer inicio de sesión.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nContraseña: ${createdCredentials.password}`)
                        showToast('Credenciales copiadas')
                      }}
                    >
                      Copiar Credenciales
                    </button>
                    <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Listo</button>
                  </div>
                </div>
              ) : (
                <>
                  <ModalField label="Nombre del Hotel *">
                    <input
                      className="w-full p-2 rounded bg-[#0d0d14] border border-[#2a2a3e] text-white text-[13px]"
                      value={form.name || ''}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="ej. Hotel Estelar"
                    />
                  </ModalField>
                  <ModalField label="Dirección">
                    <input
                      className="w-full p-2 rounded bg-[#0d0d14] border border-[#2a2a3e] text-white text-[13px]"
                      value={form.address || ''}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Calle, Ciudad, País"
                    />
                  </ModalField>
                  <div className="grid grid-cols-2 gap-3">
                    <ModalField label="Email">
                      <input
                        className="w-full p-2 rounded bg-[#0d0d14] border border-[#2a2a3e] text-white text-[13px]"
                        type="email"
                        value={form.email || ''}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="info@hotel.com"
                      />
                    </ModalField>
                    <ModalField label="Teléfono">
                      <input
                        className="w-full p-2 rounded bg-[#0d0d14] border border-[#2a2a3e] text-white text-[13px]"
                        value={form.phone || ''}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+57 300 123 4567"
                      />
                    </ModalField>
                  </div>
                  <ModalField label="Comisión (%)">
                    <input
                      className="w-full p-2 rounded bg-[#0d0d14] border border-[#2a2a3e] text-white text-[13px]"
                      type="number"
                      min="0"
                      max="100"
                      value={form.commission_rate || ''}
                      onChange={e => setForm(p => ({ ...p, commission_rate: e.target.value }))}
                      placeholder="10"
                    />
                  </ModalField>

                  {/* Manager section - only when creating */}
                  {!editHotel && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2a2a3e' }}>
                      <div className="text-[13px] font-semibold text-white mb-3">Cuenta del Gerente</div>
                      <ModalField label="Nombre completo *">
                        <input
                          className="w-full p-2 rounded bg-[#0d0d14] border border-[#2a2a3e] text-white text-[13px]"
                          value={form.manager_name || ''}
                          onChange={e => setForm(p => ({ ...p, manager_name: e.target.value }))}
                          placeholder="ej. Juan Pérez"
                        />
                      </ModalField>
                      <ModalField label="Email (Login) *">
                        <input
                          className="w-full p-2 rounded bg-[#0d0d14] border border-[#2a2a3e] text-white text-[13px]"
                          type="email"
                          value={form.manager_email || ''}
                          onChange={e => setForm(p => ({ ...p, manager_email: e.target.value }))}
                          placeholder="gerente@hotel.com"
                        />
                      </ModalField>
                      <ModalField label="Contraseña Temporal *">
                        <div className="flex gap-2">
                          <input
                            className="flex-1 p-2 rounded bg-[#0d0d14] border border-[#2a2a3e] text-white text-[13px] font-mono"
                            value={form.manager_password || ''}
                            onChange={e => setForm(p => ({ ...p, manager_password: e.target.value }))}
                            placeholder="Mín. 8 caracteres"
                          />
                          <button
                            type="button"
                            className="px-3 py-2 rounded bg-[#2a2a3e] text-white text-[12px] font-medium hover:bg-[#3a3a4e] transition-colors whitespace-nowrap"
                            onClick={() => setForm(p => ({ ...p, manager_password: generatePassword() }))}
                          >
                            Regenerar
                          </button>
                        </div>
                      </ModalField>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #2a2a3e' }}>
                    <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={save}>
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

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[12px] font-medium text-fg-muted mb-1">{label}</label>
      {children}
    </div>
  )
}
