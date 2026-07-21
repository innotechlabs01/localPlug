'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { HotelDateFilterProvider, useHotelDateFilter } from '@/lib/hotel/date-filter-context'
import { InactivityGuard } from '@/components/shared/InactivityGuard'

interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
}

const navLinks: NavLink[] = [
  {
    label: 'Dashboard',
    href: '/hotel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Reservaciones',
    href: '/hotel/reservations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Habitaciones',
    href: '/hotel/rooms',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" /><path d="M3 7v14" /><path d="M21 7v14" />
        <rect x="5" y="7" width="4" height="4" /><rect x="10" y="7" width="4" height="4" /><rect x="15" y="7" width="4" height="4" />
        <rect x="5" y="13" width="4" height="4" /><rect x="10" y="13" width="4" height="4" /><rect x="15" y="13" width="4" height="4" />
      </svg>
    ),
  },
  {
    label: 'Servicios',
    href: '/hotel/services',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Perfil',
    href: '/hotel/profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Configuración',
    href: '/hotel/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

function DateNav() {
  const now = new Date()
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const [date, setDate] = useState(now)
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const { setDateRange } = useHotelDateFilter()

  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const computeRange = useCallback((d: Date, v: string) => {
    let from: string, to: string
    if (v === 'day') {
      from = to = fmt(d)
    } else if (v === 'week') {
      const s = new Date(d); s.setDate(d.getDate() - d.getDay() + 1)
      const e = new Date(s); e.setDate(s.getDate() + 6)
      from = fmt(s); to = fmt(e)
    } else if (v === 'month') {
      from = fmt(new Date(d.getFullYear(), d.getMonth(), 1))
      to = fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    } else {
      from = `${d.getFullYear()}-01-01`
      to = `${d.getFullYear()}-12-31`
    }
    return { dateFrom: from, dateTo: to }
  }, [])

  useEffect(() => {
    const { dateFrom, dateTo } = computeRange(date, view)
    setDateRange(dateFrom, dateTo)
  }, [date, view, computeRange, setDateRange])

  const formatLabel = () => {
    if (view === 'day') return `${dayNames[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
    if (view === 'week') {
      const s = new Date(date); s.setDate(date.getDate() - date.getDay() + 1)
      const e = new Date(s); e.setDate(s.getDate() + 6)
      return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`
    }
    if (view === 'month') return `${months[date.getMonth()]} ${date.getFullYear()}`
    return `${date.getFullYear()}`
  }

  const formatSub = () => {
    if (view === 'day') return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    if (view === 'week') return `Semana ${Math.ceil(((date.getTime() - new Date(date.getFullYear(),0,1).getTime()) / 86400000 + 1) / 7)}`
    if (view === 'month') return `Mes ${Math.ceil(date.getDate() / 7)} de 4`
    return 'Año Fiscal'
  }

  const goPrev = () => {
    const d = new Date(date)
    if (view === 'day') d.setDate(d.getDate() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else if (view === 'month') d.setMonth(d.getMonth() - 1)
    else d.setFullYear(d.getFullYear() - 1)
    setDate(d)
  }

  const goNext = () => {
    const d = new Date(date)
    if (view === 'day') d.setDate(d.getDate() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else if (view === 'month') d.setMonth(d.getMonth() + 1)
    else d.setFullYear(d.getFullYear() + 1)
    setDate(d)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 24px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={goPrev} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          border: '1px solid var(--border)', background: 'var(--bg-elevated)',
          color: 'var(--text-muted)', transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-gold)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button
          onClick={() => { const d = new Date(); setDate(d) }}
          style={{
            padding: '5px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
            fontWeight: 600, cursor: 'pointer', border: 'none',
            background: 'var(--accent-gold)', color: 'var(--bg-dark)',
            transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)', letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-gold-light)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-gold)' }}
        >
          Hoy
        </button>
        <button onClick={goNext} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          border: '1px solid var(--border)', background: 'var(--bg-elevated)',
          color: 'var(--text-muted)', transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-gold)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{formatLabel()}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{formatSub()}</div>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {(['day', 'week', 'month', 'year'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: '11px',
              fontWeight: 600, cursor: 'pointer', border: 'none',
              background: view === v ? 'rgba(212,165,116,0.15)' : 'transparent',
              color: view === v ? 'var(--accent-gold)' : 'var(--text-muted)',
              transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)', letterSpacing: '0.03em',
            }}
            onMouseEnter={e => { if (view !== v) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)' }}}
            onMouseLeave={e => { if (view !== v) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}}
          >
            {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : v === 'month' ? 'Mes' : 'Año'}
          </button>
        ))}
      </div>
    </div>
  )
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { signOut } = useClerk()
  const pathname = usePathname()

  const logoBox: React.CSSProperties = {
    width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 700,
    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
    color: 'var(--bg-dark)',
  }

  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 14px', borderRadius: 0,
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    textDecoration: 'none',
    background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
    transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
    marginLeft: '-12px', marginRight: '-12px',
    width: 'calc(100% + 24px)',
  })

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '20px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={logoBox}>H</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Hotel Portal</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>LocalPlug</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navLinks.map((link) => {
          const isActive = link.href === '/hotel' ? pathname === '/hotel' : pathname.startsWith(link.href.split('?')[0])
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavClick}
              style={navLinkStyle(isActive)}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => signOut({ redirectUrl: '/sign-in/hotel' })}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            color: 'var(--text-muted)', border: 'none', background: 'transparent',
            transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </>
  )
}

function HotelLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-dark)' }}>
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          width: 260,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="hotel-sidebar"
      >
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="hotel-menu-btn"
            style={{
              padding: '8px', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--bg-elevated)',
              transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-gold)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Panel de Hotel</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div           style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))',
              color: 'var(--bg-dark)',
            }}>H</div>
          </div>
        </header>

        <DateNav />

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>

      <InactivityGuard signOutRedirectUrl="/sign-in/hotel" />

      <style>{`
        @media (max-width: 1023px) {
          .hotel-sidebar {
            transform: translateX(-100%) !important;
          }
          .hotel-sidebar[data-open="true"] {
            transform: translateX(0) !important;
          }
          .hotel-menu-btn { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .hotel-sidebar {
            position: relative !important;
            flex-shrink: 0 !important;
            width: 260px !important;
            z-index: auto !important;
            transform: none !important;
          }
          .hotel-menu-btn { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

export default function HotelLayout({ children }: { children: React.ReactNode }) {
  return (
    <HotelDateFilterProvider>
      <HotelLayoutInner>{children}</HotelLayoutInner>
    </HotelDateFilterProvider>
  )
}
