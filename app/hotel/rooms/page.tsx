'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  cardStyle, tableHeaderStyle, tableCellStyle, sectionTitle,
  inputStyle, labelStyle, badge, btnPrimary, btnGhost, ROOM_STATUS,
} from '@/lib/hotel/styles'

interface Room {
  id: number; name: string; description: string | null; capacity: number; price_per_night: number
  beds: number | null; breakfast_included: number; status: string; amenities: string | null
}

const EMPTY_FORM = { name: '', description: '', capacity: 2, price_per_night: 0, beds: 1, breakfast_included: false, amenities: '' }

export default function HotelRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)

  const loadRooms = () => {
    fetch('/api/hotel/rooms')
      .then(r => r.json())
      .then(data => setRooms(data.rooms || []))
      .catch(() => setError('Error al cargar habitaciones'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/hotel/ensure')
      .then(r => r.json())
      .then(data => { if (data.error) setError(data.error) })
      .catch(() => setError('Error al cargar perfil'))
      .finally(() => setLoading(false))
    loadRooms()
  }, [])

  const total = useMemo(() => ({
    total: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }), [rooms])

  const renderAmenities = (amenitiesRaw: string | null) => {
    if (!amenitiesRaw) return null
    try {
      const arr = JSON.parse(amenitiesRaw)
      if (!Array.isArray(arr) || arr.length === 0) return null
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {arr.slice(0, 3).map((a: string, i: number) => (
            <span key={i} style={badge('rgba(212,165,116,0.1)', 'var(--accent-gold)')}>{a}</span>
          ))}
          {arr.length > 3 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{arr.length - 3}</span>}
        </div>
      )
    } catch { return amenitiesRaw }
  }

  const handleSave = async () => {
    if (!form.name || !form.price_per_night) return
    setSaving(true)
    try {
      const amenities = form.amenities.split(',').map(a => a.trim()).filter(Boolean)
      const payload = { ...form, amenities, capacity: Number(form.capacity), price_per_night: Number(form.price_per_night), beds: Number(form.beds) }
      const url = editing ? '/api/hotel/rooms' : '/api/hotel/rooms'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: editing ? JSON.stringify({ ...payload, id: editing }) : JSON.stringify(payload),
      })
      if (res.ok) {
        setShowForm(false); setEditing(null); setForm(EMPTY_FORM); loadRooms()
      }
    } finally { setSaving(false) }
  }

  const handleEdit = (room: Room) => {
    let amenitiesStr = ''
    try { amenitiesStr = JSON.parse(room.amenities || '[]').join(', ') } catch {}
    setForm({
      name: room.name, description: room.description || '', capacity: room.capacity,
      price_per_night: room.price_per_night, beds: room.beds ?? 1,
      breakfast_included: !!room.breakfast_included, amenities: amenitiesStr,
    })
    setEditing(room.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar esta habitación?')) return
    await fetch(`/api/hotel/rooms?id=${id}`, { method: 'DELETE' })
    loadRooms()
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>
            Habitaciones
          </h1>
          <span style={badge('rgba(212,165,116,0.12)', 'var(--accent-gold)')}>{total.total}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {total.total > 0 && (
            <>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                {total.available} disp.
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab208', display: 'inline-block' }} />
                {total.occupied} ocup.
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                {total.maintenance} mto.
              </span>
            </>
          )}
          <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }} style={btnPrimary}>+ Nueva Habitación</button>
        </div>
      </div>

      {/* Rooms table */}
      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          {rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 21h18" /><path d="M3 7v14" /><path d="M21 7v14" />
                  <rect x="5" y="7" width="4" height="4" /><rect x="10" y="7" width="4" height="4" /><rect x="15" y="7" width="4" height="4" />
                  <rect x="5" y="13" width="4" height="4" /><rect x="10" y="13" width="4" height="4" /><rect x="15" y="13" width="4" height="4" />
                </svg>
              </div>
              <p style={{ fontSize: '14px' }}>No hay habitaciones registradas</p>
              <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.6 }}>Agrega tu primera habitación para comenzar</p>
              <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }} style={{ ...btnPrimary, marginTop: '16px' }}>+ Agregar Habitación</button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Nombre</th>
                  <th style={tableHeaderStyle}>Capacidad</th>
                  <th style={tableHeaderStyle}>Precio/Noche</th>
                  <th style={tableHeaderStyle}>Camas</th>
                  <th style={tableHeaderStyle}>Desayuno</th>
                  <th style={tableHeaderStyle}>Estado</th>
                  <th style={tableHeaderStyle}>Comodidades</th>
                  <th style={tableHeaderStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r, idx) => {
                  const s = ROOM_STATUS[r.status] || { bg: 'rgba(100,100,100,0.12)', fg: '#9ca3af', label: r.status }
                  return (
                    <tr key={r.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', transition: 'background 200ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                    >
                      <td style={{ ...tableCellStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</td>
                      <td style={tableCellStyle}>{r.capacity} personas</td>
                      <td style={{ ...tableCellStyle, fontWeight: 600, color: 'var(--accent-gold)' }}>${r.price_per_night}</td>
                      <td style={tableCellStyle}>{r.beds ?? r.capacity}</td>
                      <td style={tableCellStyle}>
                        {r.breakfast_included
                          ? <span style={{ color: 'var(--success)' }}>Si</span>
                          : <span style={{ color: 'var(--text-muted)' }}>No</span>}
                      </td>
                      <td style={tableCellStyle}>
                        <span style={badge(s.bg, s.fg)}>{s.label}</span>
                      </td>
                      <td style={tableCellStyle}>{renderAmenities(r.amenities) || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEdit(r)} style={{ ...btnGhost, padding: '5px 10px', fontSize: '11px' }}>Editar</button>
                          <button onClick={() => handleDelete(r.id)} style={{ ...btnGhost, padding: '5px 10px', fontSize: '11px', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.3)' }}>X</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditing(null) } }}
        >
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '28px', width: '480px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>
                {editing ? 'Editar Habitacion' : 'Nueva Habitacion'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Suite Presidencial" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descripcion</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripcion de la habitacion..." style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Capacidad</label>
                  <input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Camas</label>
                  <input type="number" min={1} value={form.beds} onChange={e => setForm(f => ({ ...f, beds: Number(e.target.value) }))} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Precio por noche *</label>
                <input type="number" min={0} value={form.price_per_night || ''} onChange={e => setForm(f => ({ ...f, price_per_night: Number(e.target.value) }))} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Comodidades (separadas por coma)</label>
                <input value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="WiFi, TV, AC, Minibar" style={inputStyle} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.breakfast_included} onChange={e => setForm(f => ({ ...f, breakfast_included: e.target.checked }))} style={{ accentColor: 'var(--accent-gold)' }} />
                Desayuno incluido
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setEditing(null) }} style={btnGhost}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price_per_night} style={{ ...btnPrimary, opacity: saving || !form.name || !form.price_per_night ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Habitacion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
