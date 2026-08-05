'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { InactivityGuard } from '@/components/shared/InactivityGuard'

interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
}

const navLinks: NavLink[] = [
  {
    label: 'Dashboard',
    href: '/driver',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Asignaciones',
    href: '/driver/assignments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
        <path d="M16 8h4l3 3v5a2 2 0 0 1-2 2h-1" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    label: 'Earnings',
    href: '/driver/earnings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Configuración',
    href: '/driver/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [driverStatus, setDriverStatus] = useState<string>('inactive')
  const [toggling, setToggling] = useState(false)

  // Auto-create driver profile + fix role mismatch on first load
  useEffect(() => {
    fetch('/api/driver/ensure')
      .then(() => fetch('/api/driver/claim-role'))
      .then(() => fetch('/api/driver/profile'))
      .then(r => r.json())
      .then(data => {
        if (data.driver?.status) setDriverStatus(data.driver.status)
      })
      .catch(() => {})
  }, [])

  const toggleStatus = async () => {
    if (toggling) return
    setToggling(true)
    try {
      const newStatus = driverStatus === 'available' ? 'inactive' : 'available'
      const res = await fetch('/api/driver/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setDriverStatus(newStatus)
      }
    } catch {
      // ignore
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="driver-app" style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg-dark)' }}>
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        data-open={sidebarOpen}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          width: 'var(--nav-width)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="driver-sidebar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--accent-gold-soft, rgba(212, 168, 75, 0.15))',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>Driver Portal</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.3px' }}>LocalPlug</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navLinks.map((link) => {
            const isActive = link.href === '/driver'
              ? pathname === '/driver'
              : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(212, 168, 75, 0.12)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface-hover, rgba(255,255,255,0.05))'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    left: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    background: 'var(--accent-gold)',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <span style={{ opacity: isActive ? 1 : 0.7, display: 'flex' }}>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px 4px' }}>
          <button
            onClick={toggleStatus}
            disabled={toggling}
            role="switch"
            aria-checked={driverStatus === 'available'}
            aria-label={driverStatus === 'available' ? 'Desactivar sesión' : 'Activar sesión'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: driverStatus === 'available' ? '#4ade80' : 'var(--text-muted)',
              background: driverStatus === 'available' ? 'rgba(74,222,128,0.1)' : 'transparent',
              border: `1px solid ${driverStatus === 'available' ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`,
              cursor: toggling ? 'wait' : 'pointer',
              transition: 'all 200ms ease',
              opacity: toggling ? 0.6 : 1,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: driverStatus === 'available' ? '#4ade80' : 'var(--text-muted)',
                boxShadow: driverStatus === 'available' ? '0 0 8px rgba(74,222,128,0.5)' : 'none',
              }} />
              {driverStatus === 'available' ? 'Activo' : 'Inactivo'}
            </span>
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              transform: driverStatus === 'available' ? 'scaleX(1)' : 'scaleX(-1)',
            }}>
              {driverStatus === 'available' ? '● ONLINE' : '○ OFFLINE'}
            </span>
          </button>
        </div>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => signOut({ redirectUrl: '/sign-in/driver' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 500,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger)'
              e.currentTarget.style.background = 'var(--danger-soft, rgba(239, 68, 80, 0.08))'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: 'var(--nav-width)' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: 'var(--topbar-height)',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="driver-mobile-menu-btn"
            style={{
              display: 'none',
              width: 36, height: 36, padding: 0,
              borderRadius: 8, border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>Panel de Conductor</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark, #b8956a))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 600, fontSize: 13,
                cursor: 'pointer',
                transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <InactivityGuard signOutRedirectUrl="/sign-in/driver" />

      <style>{`
        @media (max-width: 1023px) {
          .driver-sidebar {
            transform: translateX(-100%) !important;
          }
          .driver-sidebar[data-open="true"] {
            transform: translateX(0) !important;
          }
          .driver-mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
