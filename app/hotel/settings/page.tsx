'use client'

import { useState, useEffect } from 'react'
import { sectionTitle, inputStyle, labelStyle, btnPrimary } from '@/lib/hotel/styles'

interface Settings {
  name: string; description: string; address: string; phone: string
  email: string; website: string; bank_account: string; permits: string
  theme: { primary: string; background: string; surface: string; text: string }
}

const PRESET_THEMES = [
  { name: 'Dorado', primary: '#c8a962', background: '#0a0a0f', surface: '#1a1a2e', text: '#ffffff' },
  { name: 'Verde', primary: '#10b981', background: '#0a0a0f', surface: '#1a1a2e', text: '#ffffff' },
  { name: 'Azul', primary: '#3b82f6', background: '#0a0a0f', surface: '#1a1a2e', text: '#ffffff' },
  { name: 'Rosa', primary: '#ec4899', background: '#0a0a0f', surface: '#1a1a2e', text: '#ffffff' },
  { name: 'Blanco', primary: '#ffffff', background: '#0f0f0f', surface: '#1a1a1a', text: '#ffffff' },
  { name: 'Lavanda', primary: '#a78bfa', background: '#0a0a0f', surface: '#1a1a2e', text: '#ffffff' },
]

const sectionCard: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)', padding: '24px',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

export default function HotelSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<Settings>({
    name: '', description: '', address: '', phone: '', email: '', website: '',
    bank_account: '', permits: '',
    theme: { primary: '#c8a962', background: '#0a0a0f', surface: '#1a1a2e', text: '#ffffff' },
  })

  useEffect(() => {
    fetch('/api/hotel/settings')
      .then(r => r.json())
      .then(data => { if (data.settings) setForm(data.settings) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/hotel/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true); setTimeout(() => setSaved(false), 3000)
        applyTheme(form.theme)
      }
    } finally { setSaving(false) }
  }

  const applyTheme = (theme: Settings['theme']) => {
    const root = document.documentElement
    root.style.setProperty('--accent-gold', theme.primary)
    root.style.setProperty('--bg-dark', theme.background)
    root.style.setProperty('--bg-card', theme.surface)
    root.style.setProperty('--text-primary', theme.text)
  }

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    const t = { primary: preset.primary, background: preset.background, surface: preset.surface, text: preset.text }
    setForm(f => ({ ...f, theme: t })); applyTheme(t)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'var(--accent-gold)' }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'var(--border)' }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>Configuracion</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Personaliza tu hotel y apariencia del portal</p>
      </div>

      {/* Profile Section */}
      <section style={sectionCard}>
        <div style={sectionTitle}>Perfil del Hotel</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Nombre del Hotel">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Hotel Estelar" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </Field>
          <Field label="Descripcion">
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripcion del hotel..." style={{ ...inputStyle, resize: 'vertical' as const }} onFocus={handleFocus} onBlur={handleBlur} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Direccion">
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle 10 #5-20" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </Field>
            <Field label="Telefono">
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+57 4 123 4567" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="info@hotel.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </Field>
            <Field label="Website">
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://hotel.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </Field>
          </div>
        </div>
      </section>

      {/* Payment Section */}
      <section style={sectionCard}>
        <div style={sectionTitle}>Metodo de Pago</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field label="Cuenta Bancaria">
            <input value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} placeholder="Numero de cuenta para consignaciones" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </Field>
          <Field label="Permisos / Licencias">
            <input value={form.permits} onChange={e => setForm(f => ({ ...f, permits: e.target.value }))} placeholder="Numero de registro turistico" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </Field>
        </div>
      </section>

      {/* Theme Section */}
      <section style={sectionCard}>
        <div style={sectionTitle}>Apariencia</div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Selecciona un tema predefinido o personaliza los colores</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {PRESET_THEMES.map(preset => {
            const isActive = form.theme.primary === preset.primary
            return (
              <button key={preset.name} onClick={() => applyPreset(preset)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', background: isActive ? 'rgba(212,165,116,0.15)' : 'var(--bg-elevated)',
                  border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border)'}`,
                  color: 'var(--text-primary)', transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: preset.primary, boxShadow: isActive ? `0 0 0 2px var(--bg-card), 0 0 0 3px ${preset.primary}` : 'none' }} />
                {preset.name}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {([
            ['Color Principal', 'primary'],
            ['Fondo', 'background'],
            ['Superficie', 'surface'],
            ['Texto', 'text'],
          ] as const).map(([label, key]) => (
            <Field key={key} label={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={form.theme[key]} onChange={e => {
                  const t = { ...form.theme, [key]: e.target.value }
                  setForm(f => ({ ...f, theme: t })); applyTheme(t)
                }} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border)', padding: 0, background: 'none' }} />
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{form.theme[key]}</span>
              </div>
            </Field>
          ))}
        </div>
      </section>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={save} disabled={saving}
          style={{ ...btnPrimary, opacity: saving ? 0.5 : 1, boxShadow: '0 2px 8px rgba(212,165,116,0.25)' }}>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--success)', animation: 'fadeIn 200ms cubic-bezier(0.4,0,0.2,1)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Guardado correctamente
          </span>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
