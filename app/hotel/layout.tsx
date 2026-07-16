'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { HotelDateFilterProvider, useHotelDateFilter } from '@/lib/hotel/date-filter-context'

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
    href: '/hotel?tab=rooms',
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
    href: '/hotel?tab=services',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Perfil',
    href: '/hotel?tab=profile',
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
    <div className="flex items-center justify-between px-4 lg:px-6 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div className="flex items-center gap-2">
        <button onClick={goPrev} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button
          onClick={() => { const d = new Date(); setDate(d) }}
          className="px-3 py-1 rounded-lg text-xs font-medium"
          style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)' }}
        >
          Hoy
        </button>
        <button onClick={goNext} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatLabel()}</div>
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatSub()}</div>
      </div>
      <div className="flex gap-1">
        {(['day', 'week', 'month', 'year'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: view === v ? 'rgba(200, 169, 98, 0.15)' : 'transparent',
              color: view === v ? 'var(--accent-gold)' : 'var(--text-muted)',
            }}
          >
            {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : v === 'month' ? 'Mes' : 'Año'}
          </button>
        ))}
      </div>
    </div>
  )
}

function HotelLayoutInner({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-dark)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)' }}>H</div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hotel Portal</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>LocalPlug</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = link.href === '/hotel' ? pathname === '/hotel' : pathname.startsWith(link.href.split('?')[0])
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: isActive ? 'rgba(200, 169, 98, 0.12)' : 'transparent', color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
              >
                {link.icon}
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => signOut({ redirectUrl: '/sign-in/hotel' })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 lg:px-6 py-3" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Panel de Hotel</div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-gold)', color: 'var(--bg-dark)' }}>H</div>
          </div>
        </header>

        <DateNav />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
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
