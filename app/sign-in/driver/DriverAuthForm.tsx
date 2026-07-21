'use client'

import { useState } from 'react'
import { SignIn } from '@clerk/nextjs'

export default function DriverAuthForm() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    vehicle: '', plate: '', category: 'standard',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/driver/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setSuccess('Registration successful! You can now sign in with your credentials.')
      setMode('sign-in')
      setForm({ name: '', email: '', password: '', phone: '', vehicle: '', plate: '', category: 'standard' })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'sign-in') {
    return (
      <div>
        {success && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 20,
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
            color: '#4ade80', fontSize: 13,
          }}>
            {success}
          </div>
        )}

        <SignIn
          forceRedirectUrl="/driver"
          appearance={{
            variables: {
              colorPrimary: '#4ade80',
              colorBackground: 'transparent',
              colorText: 'var(--text-primary)',
              colorInputText: 'var(--text-primary)',
              colorInputBackground: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
            },
            elements: {
              rootBox: { width: '100%' },
              card: {
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                width: '100%',
                padding: 0,
              },
              headerTitle: {
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 600,
              },
              headerSubtitle: {
                color: 'var(--text-muted)',
                fontSize: '13px',
              },
              formFieldLabel: {
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
              },
              formFieldInput: {
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                padding: '12px 14px',
                transition: 'border-color 200ms cubic-bezier(0.4,0,0.2,1)',
              },
              formButtonPrimary: {
                background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                color: '#0c0c14',
                fontWeight: 600,
                fontSize: '14px',
                padding: '12px 0',
                boxShadow: '0 4px 16px rgba(74,222,128,0.25)',
                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  boxShadow: '0 6px 24px rgba(74,222,128,0.35)',
                  transform: 'translateY(-1px)',
                },
              },
              footerActionLink: {
                color: '#4ade80',
                fontSize: '13px',
                fontWeight: 500,
              },
              dividerLine: { background: 'var(--border)' },
              dividerText: { color: 'var(--text-muted)', fontSize: '12px' },
              socialButtonsBlockButton: {
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  background: 'var(--surface)',
                  borderColor: '#4ade80',
                },
              },
              socialButtonsBlockButtonText: { color: 'var(--text-primary)', fontWeight: 500 },
              formFieldInputShowPasswordButton: { color: 'var(--text-muted)' },
              identityPreviewEditButton: { color: '#4ade80' },
              footer: { padding: 0, marginTop: '24px' },
              footerAction: { padding: 0 },
            },
          }}
        />

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => { setMode('sign-up'); setError(''); setSuccess('') }}
            style={{
              background: 'none', border: 'none', color: '#4ade80',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            No tienes cuenta? Registrate
          </button>
        </div>
      </div>
    )
  }

  // Sign-up mode
  return (
    <div>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 8,
            background: 'rgba(239,68,80,0.1)', border: '1px solid rgba(239,68,80,0.2)',
            color: '#ef4444', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 6,
          }}>
            Nombre completo *
          </label>
          <input
            name="name" value={form.name} onChange={handleChange} required
            placeholder="Juan Perez"
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)',
              outline: 'none', transition: 'border-color 200ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4ade80' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 6,
          }}>
            Email *
          </label>
          <input
            name="email" type="email" value={form.email} onChange={handleChange} required
            placeholder="juan@email.com"
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)',
              outline: 'none', transition: 'border-color 200ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4ade80' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 6,
          }}>
            Contrasena *
          </label>
          <input
            name="password" type="password" value={form.password} onChange={handleChange} required
            minLength={8}
            placeholder="Minimo 8 caracteres"
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)',
              outline: 'none', transition: 'border-color 200ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4ade80' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 6,
          }}>
            Telefono
          </label>
          <input
            name="phone" value={form.phone} onChange={handleChange}
            placeholder="+57 300 123 4567"
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)',
              outline: 'none', transition: 'border-color 200ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#4ade80' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 6,
            }}>
              Vehiculo *
            </label>
            <input
              name="vehicle" value={form.vehicle} onChange={handleChange} required
              placeholder="Toyota Hilux"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 14,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-primary)',
                outline: 'none', transition: 'border-color 200ms',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4ade80' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600,
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 6,
            }}>
              Placa *
            </label>
            <input
              name="plate" value={form.plate} onChange={handleChange} required
              placeholder="ABC 123"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 14,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-primary)',
                outline: 'none', transition: 'border-color 200ms',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#4ade80' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          style={{
            width: '100%', padding: '12px 0', border: 'none', borderRadius: 8,
            background: loading ? 'rgba(74,222,128,0.5)' : 'linear-gradient(135deg, #4ade80, #16a34a)',
            color: '#0c0c14', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(74,222,128,0.25)',
            transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          onClick={() => { setMode('sign-in'); setError(''); setSuccess('') }}
          style={{
            background: 'none', border: 'none', color: '#4ade80',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}
        >
          Ya tienes cuenta? Inicia sesion
        </button>
      </div>
    </div>
  )
}
