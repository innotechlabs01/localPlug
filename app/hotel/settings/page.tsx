'use client'

import { useState, useEffect } from 'react'

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

export default function HotelSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
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
      .then(data => {
        if (data.settings) {
          setSettings(data.settings)
          setForm(data.settings)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/hotel/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        // Apply theme to CSS variables
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
    setForm(f => ({ ...f, theme: { primary: preset.primary, background: preset.background, surface: preset.surface, text: preset.text } }))
    applyTheme({ primary: preset.primary, background: preset.background, surface: preset.surface, text: preset.text })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent-gold)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Configuración</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Personaliza tu hotel y apariencia del portal</p>
      </div>

      {/* Profile Section */}
      <section className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent-gold)' }}>Perfil del Hotel</h2>
        <div className="space-y-3">
          <Field label="Nombre del Hotel">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Hotel Estelar" />
          </Field>
          <Field label="Descripción">
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del hotel..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dirección">
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle 10 #5-20" />
            </Field>
            <Field label="Teléfono">
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+57 4 123 4567" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="info@hotel.com" />
            </Field>
            <Field label="Website">
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://hotel.com" />
            </Field>
          </div>
        </div>
      </section>

      {/* Payment Section */}
      <section className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent-gold)' }}>Método de Pago</h2>
        <div className="space-y-3">
          <Field label="Cuenta Bancaria">
            <input value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} placeholder="Número de cuenta para consignaciones" />
          </Field>
          <Field label="Permisos / Licencias">
            <input value={form.permits} onChange={e => setForm(f => ({ ...f, permits: e.target.value }))} placeholder="Número de registro turístico" />
          </Field>
        </div>
      </section>

      {/* Theme Section */}
      <section className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--accent-gold)' }}>Apariencia</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Selecciona un tema predefinido o personaliza los colores</p>

        {/* Preset themes */}
        <div className="flex flex-wrap gap-2 mb-5">
          {PRESET_THEMES.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: form.theme.primary === preset.primary ? 'rgba(200,169,98,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${form.theme.primary === preset.primary ? 'var(--accent-gold)' : 'var(--border)'}`,
                color: 'var(--text-primary)',
              }}
            >
              <div className="w-4 h-4 rounded-full" style={{ background: preset.primary }} />
              {preset.name}
            </button>
          ))}
        </div>

        {/* Custom colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Color Principal">
            <div className="flex items-center gap-2">
              <input type="color" value={form.theme.primary} onChange={e => {
                const t = { ...form.theme, primary: e.target.value }
                setForm(f => ({ ...f, theme: t }))
                applyTheme(t)
              }} className="w-8 h-8 rounded cursor-pointer border-0" />
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{form.theme.primary}</span>
            </div>
          </Field>
          <Field label="Fondo">
            <div className="flex items-center gap-2">
              <input type="color" value={form.theme.background} onChange={e => {
                const t = { ...form.theme, background: e.target.value }
                setForm(f => ({ ...f, theme: t }))
                applyTheme(t)
              }} className="w-8 h-8 rounded cursor-pointer border-0" />
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{form.theme.background}</span>
            </div>
          </Field>
          <Field label="Superficie">
            <div className="flex items-center gap-2">
              <input type="color" value={form.theme.surface} onChange={e => {
                const t = { ...form.theme, surface: e.target.value }
                setForm(f => ({ ...f, theme: t }))
                applyTheme(t)
              }} className="w-8 h-8 rounded cursor-pointer border-0" />
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{form.theme.surface}</span>
            </div>
          </Field>
          <Field label="Texto">
            <div className="flex items-center gap-2">
              <input type="color" value={form.theme.text} onChange={e => {
                const t = { ...form.theme, text: e.target.value }
                setForm(f => ({ ...f, theme: t }))
                applyTheme(t)
              }} className="w-8 h-8 rounded cursor-pointer border-0" />
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{form.theme.text}</span>
            </div>
          </Field>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)' }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        {saved && (
          <span className="text-sm font-medium" style={{ color: 'var(--admin-accent)' }}>
            Guardado correctamente
          </span>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}
