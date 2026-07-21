'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  cardStyle, tableHeaderStyle, tableCellStyle, badge, btnPrimary, btnGhost,
  inputStyle, labelStyle,
} from '@/lib/hotel/styles'

interface Service {
  id: number; name: string; description: string | null; base_price: number
  commission_applies: number; active: number
}

const EMPTY_FORM = { name: '', description: '', base_price: 0, commission_applies: true }

export default function HotelServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)

  const loadServices = () => {
    fetch('/api/hotel/services')
      .then(r => r.json())
      .then(data => setServices(data.services || []))
      .catch(() => setError('Error al cargar servicios'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/hotel/ensure')
      .then(r => r.json())
      .then(data => { if (data.error) setError(data.error) })
      .catch(() => setError('Error al cargar perfil'))
      .finally(() => setLoading(false))
    loadServices()
  }, [])

  const stats = useMemo(() => ({
    total: services.length,
    active: services.filter(s => s.active).length,
    inactive: services.filter(s => !s.active).length,
  }), [services])

  const handleSave = async () => {
    if (!form.name || !form.base_price) return
    setSaving(true)
    try {
      const payload = { ...form, base_price: Number(form.base_price) }
      const res = await fetch('/api/hotel/services', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: editing ? JSON.stringify({ ...payload, id: editing }) : JSON.stringify(payload),
      })
      if (res.ok) {
        setShowForm(false); setEditing(null); setForm(EMPTY_FORM); loadServices()
      }
    } finally { setSaving(false) }
  }

  const handleEdit = (svc: Service) => {
    setForm({
      name: svc.name, description: svc.description || '',
      base_price: svc.base_price, commission_applies: !!svc.commission_applies,
    })
    setEditing(svc.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar este servicio?')) return
    await fetch(`/api/hotel/services?id=${id}`, { method: 'DELETE' })
    loadServices()
  }

  const handleToggleActive = async (svc: Service) => {
    await fetch('/api/hotel/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: svc.id, active: !svc.active }),
    })
    loadServices()
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>Servicios</h1>
          <span style={badge('rgba(212,165,116,0.12)', 'var(--accent-gold)')}>{stats.total}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {stats.total > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {stats.active} activos &middot; {stats.inactive} inactivos
            </div>
          )}
          <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }} style={btnPrimary}>+ Nuevo Servicio</button>
        </div>
      </div>

      {/* Services table */}
      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          {services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              </div>
              <p style={{ fontSize: '14px' }}>No hay servicios registrados</p>
              <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.6 }}>Agrega tu primer servicio para comenzar</p>
              <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }} style={{ ...btnPrimary, marginTop: '16px' }}>+ Agregar Servicio</button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Servicio</th>
                  <th style={tableHeaderStyle}>Precio</th>
                  <th style={tableHeaderStyle}>Comision</th>
                  <th style={tableHeaderStyle}>Estado</th>
                  <th style={tableHeaderStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)', transition: 'background 200ms' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                  >
                    <td style={tableCellStyle}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                        {s.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.description}</div>}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 600, color: 'var(--accent-gold)' }}>${parseFloat(String(s.base_price)).toLocaleString()}</td>
                    <td style={tableCellStyle}>
                      {s.commission_applies
                        ? <span style={badge('rgba(250,204,21,0.12)', '#facc15')}>Aplica</span>
                        : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No aplica</span>}
                    </td>
                    <td style={tableCellStyle}>
                      <button onClick={() => handleToggleActive(s)}
                        style={{ ...badge(
                          s.active ? 'rgba(74,222,128,0.12)' : 'rgba(100,100,100,0.12)',
                          s.active ? 'var(--success)' : 'var(--text-muted)',
                        ), cursor: 'pointer', border: 'none' }}>
                        {s.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleEdit(s)} style={{ ...btnGhost, padding: '5px 10px', fontSize: '11px' }}>Editar</button>
                        <button onClick={() => handleDelete(s.id)} style={{ ...btnGhost, padding: '5px 10px', fontSize: '11px', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.3)' }}>X</button>
                      </div>
                    </td>
                  </tr>
                ))}
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
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '28px', width: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>
                {editing ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Transporte al aeropuerto" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descripcion</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripcion del servicio..." style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div>
                <label style={labelStyle}>Precio base *</label>
                <input type="number" min={0} value={form.base_price || ''} onChange={e => setForm(f => ({ ...f, base_price: Number(e.target.value) }))} placeholder="0" style={inputStyle} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.commission_applies} onChange={e => setForm(f => ({ ...f, commission_applies: e.target.checked }))} style={{ accentColor: 'var(--accent-gold)' }} />
                Aplica comision al administrador
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setEditing(null) }} style={btnGhost}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.base_price} style={{ ...btnPrimary, opacity: saving || !form.name || !form.base_price ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
