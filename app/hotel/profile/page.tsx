'use client'

import { useState, useEffect } from 'react'
import { cardStyle, labelStyle, badge, btnPrimary } from '@/lib/hotel/styles'

interface Hotel {
  id: number; name: string; slug: string; description: string | null
  address: string | null; phone: string | null; email: string | null
  website: string | null; stars: number; status: string
  commission_rate: number; profile_complete: number
}

const valueStyle: React.CSSProperties = {
  fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)',
}

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value || <span style={{ color: 'var(--text-muted)' }}>-</span>}</div>
    </div>
  )
}

export default function HotelProfilePage() {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hotel/ensure')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setHotel(data.hotel)
      })
      .catch(() => setError('Error al cargar perfil'))
      .finally(() => setLoading(false))
  }, [])

  const renderStars = (count: number) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < count ? 'var(--accent-gold)' : 'none'} stroke="var(--accent-gold)" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )

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

  if (!hotel) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>Perfil del Hotel</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Información general</p>
      </div>

      {/* Status card */}
      <div style={{ ...cardStyle, padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hotel.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(250,204,21,0.12)', flexShrink: 0 }}>
          {hotel.status === 'active' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{hotel.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={badge(
              hotel.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(250,204,21,0.12)',
              hotel.status === 'active' ? 'var(--success)' : '#facc15',
            )}>{hotel.status === 'active' ? 'Activo' : 'Inactivo'}</span>
            {renderStars(hotel.stars)}
          </div>
        </div>
      </div>

      {/* Profile completion */}
      {hotel.profile_complete < 100 && (
        <div style={{ ...cardStyle, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Progreso del perfil</div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-gold)' }}>{hotel.profile_complete}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <div style={{ width: `${hotel.profile_complete}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-dark))', transition: 'width 600ms cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
        </div>
      )}

      {/* Details card */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Detalles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          <InfoField label="Nombre" value={hotel.name} />
          <InfoField label="Slug" value={hotel.slug} />
          <InfoField label="Descripción" value={hotel.description} />
          <InfoField label="Dirección" value={hotel.address} />
          <InfoField label="Teléfono" value={hotel.phone} />
          <InfoField label="Email" value={hotel.email} />
          <InfoField label="Sitio web" value={hotel.website} />
          <div>
            <div style={labelStyle}>Estrellas</div>
            <div style={{ marginTop: '4px' }}>{renderStars(hotel.stars)}</div>
          </div>
        </div>
      </div>

      {/* Commission card */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Comisión</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(212,165,116,0.06)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}>{hotel.commission_rate}%</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tasa de comision al administrador</div>
          </div>
        </div>
      </div>
    </div>
  )
}
