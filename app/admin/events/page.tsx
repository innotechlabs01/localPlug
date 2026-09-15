'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/lib/admin/toast-context'

interface PromoEvent {
  id: number
  slug: string
  title: string
  tag: string | null
  description: string | null
  highlights: string[] | null
  cta_text: string | null
  cta_href: string | null
  image: string | null
  placement: 'hero_banner' | 'section'
  active: boolean
  start_date: string | null
  end_date: string | null
  sort_order: number
}

const EMPTY_FORM = {
  slug: '',
  title: '',
  tag: '',
  description: '',
  highlights: '',
  cta_text: '',
  cta_href: '/booking',
  image: '/images/experiences-7.jpg',
  placement: 'section' as 'hero_banner' | 'section',
  active: true,
  start_date: '',
  end_date: '',
  sort_order: 0,
}

export default function AdminEventsPage() {
  const { showToast } = useToast()
  const [events, setEvents] = useState<PromoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    fetch('/api/admin/events')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setEvents(data.events || []))
      .catch(() => showToast('Error al cargar eventos'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (e: PromoEvent) => {
    setEditing(e.id)
    setForm({
      slug: e.slug,
      title: e.title,
      tag: e.tag || '',
      description: e.description || '',
      highlights: (e.highlights || []).join('\n'),
      cta_text: e.cta_text || '',
      cta_href: e.cta_href || '/booking',
      image: e.image || '/images/experiences-7.jpg',
      placement: e.placement,
      active: e.active,
      start_date: e.start_date || '',
      end_date: e.end_date || '',
      sort_order: e.sort_order || 0,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.slug || !form.title) {
      showToast('slug y título son obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        highlights: form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
      }
      const url = editing ? `/api/admin/events?id=${editing}` : '/api/admin/events'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('save failed')
      showToast(editing ? 'Evento actualizado' : 'Evento creado')
      setShowForm(false)
      load()
    } catch {
      showToast('Error al guardar el evento')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (e: PromoEvent) => {
    try {
      const res = await fetch(`/api/admin/events?id=${e.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', active: !e.active }),
      })
      if (!res.ok) throw new Error('toggle failed')
      setEvents(prev => prev.map(x => (x.id === e.id ? { ...x, active: !e.active } : x)))
    } catch {
      showToast('Error al cambiar el estado')
    }
  }

  const handleDelete = async (e: PromoEvent) => {
    if (!confirm(`¿Eliminar el evento "${e.title}"?`)) return
    try {
      const res = await fetch(`/api/admin/events?id=${e.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      setEvents(prev => prev.filter(x => x.id !== e.id))
      showToast('Evento eliminado')
    } catch {
      showToast('Error al eliminar el evento')
    }
  }

  if (loading) {
    return <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--fg-muted)' }}>Cargando…</div>
  }

  return (
    <div className="p-6" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="text-xl font-semibold">Eventos promocionales</h1>
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
            Controla banners y secciones del landing sin desplegar.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Nuevo evento</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Título</th>
                  <th style={thStyle}>Ubicación</th>
                  <th style={thStyle}>Ventana</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)' }}>
                      Sin eventos. Crea uno para mostrarlo en el landing.
                    </td>
                  </tr>
                )}
                {events.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>
                      <strong>{e.title}</strong>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{e.slug}</div>
                    </td>
                    <td style={tdStyle}>
                      <span className="badge badge-accent" style={{ fontSize: 11 }}>
                        {e.placement === 'hero_banner' ? 'Banner superior' : 'Sección'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--fg-muted)' }}>
                      {e.start_date || '—'} → {e.end_date || '—'}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => toggleActive(e)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                          padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          border: 'none', background: e.active ? 'rgba(74,222,128,0.15)' : 'rgba(100,100,100,0.12)',
                          color: e.active ? '#2eb872' : 'var(--fg-muted)',
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                        {e.active ? 'Visible' : 'Oculto'}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-ghost btn-sm" style={{ marginRight: 6 }} onClick={() => openEdit(e)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
          <div className="card" style={{ width: 'min(92vw, 560px)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <span className="card-title">{editing ? 'Editar evento' : 'Nuevo evento'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Slug *</label>
                <input className="input" value={form.slug} placeholder="feria-flores-2026"
                  onChange={e => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Título *</label>
                <input className="input" value={form.title} placeholder="Título del evento"
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Tag / etiqueta</label>
                <input className="input" value={form.tag} placeholder="Feria de las Flores 2026"
                  onChange={e => setForm({ ...form, tag: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Descripción</label>
                <textarea className="input" rows={3} value={form.description}
                  placeholder="Descripción del evento"
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Highlights (uno por línea)</label>
                <textarea className="input" rows={3} value={form.highlights}
                  placeholder={'Desfile de Silleteros — el icónico desfile\nTours por fincas floricultoras'}
                  onChange={e => setForm({ ...form, highlights: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Texto CTA</label>
                  <input className="input" value={form.cta_text} placeholder="Reserva ahora"
                    onChange={e => setForm({ ...form, cta_text: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Destino CTA</label>
                  <input className="input" value={form.cta_href} placeholder="/booking"
                    onChange={e => setForm({ ...form, cta_href: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Imagen (ruta o URL)</label>
                <input className="input" value={form.image} placeholder="/images/experiences-7.jpg"
                  onChange={e => setForm({ ...form, image: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Ubicación</label>
                  <select
                    className="input"
                    value={form.placement}
                    onChange={e => setForm({ ...form, placement: e.target.value as any })}
                  >
                    <option value="section">Sección (landing)</option>
                    <option value="hero_banner">Banner superior (hero)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Orden</label>
                  <input className="input" type="number" value={form.sort_order}
                    onChange={e => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">Inicio (YYYY-MM-DD)</label>
                  <input className="input" type="date" value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Fin (YYYY-MM-DD)</label>
                  <input className="input" type="date" value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })} />
                Visible en el sitio
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: '0.04em', color: 'var(--fg-muted)', borderBottom: '1px solid var(--border)',
}
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 13 }