'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useClerk } from '@clerk/nextjs'
import { useI18n } from '@/lib/i18n'
import { RealtimeProvider, useRealtime } from '@/lib/admin/realtime-context'
import { InactivityGuard } from '@/app/components/admin/InactivityGuard'
import { ToastProvider, useToast } from '@/lib/admin/toast-context'
import { DateFilterProvider, useDateFilter } from '@/lib/admin/date-filter-context'

interface NavItem {
  labelKey: string
  href: string
  icon: React.ReactNode
  badge?: string
}

const navSections: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: 'sectionExecutive',
    items: [
      {
        labelKey: 'dashboard',
        href: '/admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        ),
      },
      {
        labelKey: 'dispatch',
        href: '/admin/dispatch',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
          </svg>
        ),
        badge: '0',
      },
    ],
  },
  {
    labelKey: 'sectionOperations',
    items: [
      {
        labelKey: 'reservations',
        href: '/admin/reservations',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        ),
      },
      {
        labelKey: 'drivers',
        href: '/admin/drivers',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        labelKey: 'fleet',
        href: '/admin/fleet',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2M8 21h8"/>
            <circle cx="7" cy="14" r="2"/><circle cx="17" cy="14" r="2"/>
          </svg>
        ),
      },
      {
        labelKey: 'customers',
        href: '/admin/customers',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        ),
      },
      {
        labelKey: 'support',
        href: '/admin/ia-chat',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
        badge: '3',
      },
    ],
  },
  {
    labelKey: 'sectionManagement',
    items: [
      {
        labelKey: 'employees',
        href: '/admin/employees',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        labelKey: 'analytics',
        href: '/admin/analytics',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        ),
      },
      {
        labelKey: 'payments',
        href: '/admin/payments',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        ),
      },
    ],
  },
  {
    labelKey: 'sectionPartners',
    items: [
      {
        labelKey: 'hotels',
        href: '/admin/hotels',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18"/>
            <path d="M3 7v14"/>
            <path d="M21 7v14"/>
            <path d="M7 3v4"/>
            <path d="M12 3v4"/>
            <path d="M17 3v4"/>
            <rect x="5" y="7" width="4" height="4"/>
            <rect x="10" y="7" width="4" height="4"/>
            <rect x="15" y="7" width="4" height="4"/>
            <rect x="5" y="13" width="4" height="4"/>
            <rect x="10" y="13" width="4" height="4"/>
            <rect x="15" y="13" width="4" height="4"/>
          </svg>
        ),
      },
    ],
  },
]

function DateNav() {
  const now = new Date()
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const [date, setDate] = useState(now)
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const { setDateRange } = useDateFilter()

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
    if (view === 'week') return `Week ${Math.ceil(((date.getTime() - new Date(date.getFullYear(),0,1).getTime()) / 86400000 + 1) / 7)}`
    if (view === 'month') return `${Math.ceil(date.getDate() / 7)} of 4 weeks`
    return 'Fiscal Year'
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

  const goToday = () => {
    setDate(new Date())
  }

  return (
    <div className="date-nav">
      <div className="date-nav-left">
        <button className="date-arrow" onClick={goPrev}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button className="date-today-btn" onClick={goToday}>Today</button>
        <button className="date-arrow" onClick={goNext}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div className="date-nav-center">
        <span className="date-range-label">{formatLabel()}</span>
        <span className="date-range-sub">{formatSub()}</span>
      </div>
      <div className="date-nav-right">
        <div className="date-view-toggle">
          {(['day', 'week', 'month', 'year'] as const).map(v => (
            <button key={v} className={`date-view-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button className="date-calendar-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <ToastProvider>
        <DateFilterProvider>
          <AdminLayoutInner>{children}</AdminLayoutInner>
        </DateFilterProvider>
      </ToastProvider>
    </RealtimeProvider>
  )
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 shadow-[var(--shadow-elevated)] text-sm cursor-pointer animate-in fade-in slide-in-from-bottom-2"
          style={{ color: 'var(--fg)', minWidth: 240 }}
          onClick={() => removeToast(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [visibleModules, setVisibleModules] = useState<Record<string, boolean>>({})
  const [accessDenied, setAccessDenied] = useState(false)
  const [permsLoading, setPermsLoading] = useState(true)
  const { t, lang, setLang } = useI18n()
  const { notifications, unreadCount, markAsRead, markAllAsRead, stats } = useRealtime()

  useEffect(() => {
    fetch('/api/admin/permissions/mine')
      .then(r => {
        if (r.status === 401 || r.status === 403) {
          setAccessDenied(true)
          setPermsLoading(false)
          return null
        }
        return r.json()
      })
      .then(data => {
        if (!data) return
        const perms = data.permissions || {}
        const visible: Record<string, boolean> = {}
        for (const [slug, p] of Object.entries(perms) as [string, any][]) {
          if (p.can_view) visible[slug] = true
        }
        if (Object.keys(visible).length === 0) {
          setAccessDenied(true)
        } else {
          setVisibleModules(visible)
        }
      })
      .catch(() => {
        setAccessDenied(true)
      })
      .finally(() => setPermsLoading(false))
  }, [])

  const navSectionMap: Record<string, { slug: string; items: NavItem[] }> = {
    dashboard: { slug: 'dashboard', items: [] },
    dispatch: { slug: 'dispatch', items: [] },
    reservations: { slug: 'reservations', items: [] },
    drivers: { slug: 'drivers', items: [] },
    fleet: { slug: 'fleet', items: [] },
    customers: { slug: 'customers', items: [] },
    support: { slug: 'support', items: [] },
    employees: { slug: 'employees', items: [] },
    analytics: { slug: 'analytics', items: [] },
    payments: { slug: 'payments', items: [] },
    hotels: { slug: 'hotels', items: [] },
  }

  const navItemSlug: Record<string, string> = {
    '/admin': 'dashboard',
    '/admin/dispatch': 'dispatch',
    '/admin/reservations': 'reservations',
    '/admin/drivers': 'drivers',
    '/admin/fleet': 'fleet',
    '/admin/customers': 'customers',
    '/admin/ia-chat': 'support',
    '/admin/employees': 'employees',
    '/admin/analytics': 'analytics',
    '/admin/payments': 'payments',
    '/admin/hotels': 'hotels',
    '/admin/roles': 'roles',
  }

  const filteredNavSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        const slug = navItemSlug[item.href]
        return !slug || visibleModules[slug]
      }),
    }))
    .filter(section => section.items.length > 0)

  const hasRolesAccess = visibleModules['roles']

  if (isLoaded && !isSignedIn) {
    router.push('/sign-in')
    return null
  }

  if (!isLoaded || permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center" style={{ color: 'var(--fg-muted)' }}>
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          Loading...
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0b0d14' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="text-[20px] font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-[14px] text-[#9ca0b0] leading-relaxed mb-6">
            Your account does not have the necessary permissions to access the admin panel. 
            Please contact the platform administrator to request access.
          </p>
          <button
            onClick={() => signOut({ redirectUrl: '/sign-in' })}
            className="px-6 py-2.5 rounded-lg text-[13px] font-medium transition-all"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  const getPageTitle = (): string => {
    const titleMap: Record<string, string> = {
      '/admin': t.admin.dashboard.title as string,
      '/admin/dispatch': t.admin.nav.dispatch as string,
      '/admin/drivers': t.admin.nav.drivers as string,
      '/admin/fleet': t.admin.nav.fleet as string,
      '/admin/customers': t.admin.nav.customers as string,
      '/admin/ia-chat': t.admin.nav.support as string,
      '/admin/employees': t.admin.nav.employees as string,
      '/admin/analytics': t.admin.nav.analytics as string,
      '/admin/payments': t.admin.nav.payments as string,
      '/admin/agenda': 'Agenda',
      '/admin/cases': 'Cases',
      '/admin/roles': t.admin.nav.roles as string,
      '/admin/reservations': t.admin.nav.reservations as string,
    }
    return titleMap[pathname] || t.admin.dashboard.title as string
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">M</div>
          <div className="sidebar-brand">
            {t.admin.layout?.sidebarBrandTitle || 'Medellín Admin'}
            <small>{t.admin.layout?.sidebarBrandSubtitle || 'Operations Platform'}</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {(() => {
            const sections = filteredNavSections.map(s => ({ ...s, items: [...s.items] }))
            const mgmt = sections.find(s => s.labelKey === 'sectionManagement')
            if (mgmt && hasRolesAccess) {
              mgmt.items.push({
                labelKey: 'roles',
                href: '/admin/roles',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
              })
            }
            return sections
          })().map((section) => (
            <div key={section.labelKey}>
              <div className="nav-section-label">
                {t.admin.nav[section.labelKey as keyof typeof t.admin.nav] as string}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span>{t.admin.nav[item.labelKey as keyof typeof t.admin.nav] as string}</span>
                    {item.badge !== undefined && (
                      <span className="nav-badge">{item.href === '/admin/dispatch' ? stats.pending_dispatch : item.href === '/admin/ia-chat' ? stats.pending_user_reply : item.badge}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => signOut({ redirectUrl: '/sign-in' })} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'left' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t.admin.nav.signOut as string}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="icon-btn md:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="page-title">{getPageTitle()}</span>
            <span className="badge badge-accent" style={{ fontSize: 10 }}>
              {t.admin.dashboard.live as string}
            </span>
          </div>
          <div className="topbar-right">
            <div className="search-input" style={{ width: 200 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                placeholder={t.admin.dashboard.searchBookings as string}
              />
            </div>
            <select
              className="input"
              style={{ width: 'auto', padding: '6px 10px', fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)', outline: 'none' }}
              value={lang}
              onChange={(e) => setLang(e.target.value as 'en' | 'es')}
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
            <button className="icon-btn relative" onClick={() => setNotifOpen(!notifOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-12 top-full mt-2 w-[340px] max-h-[400px] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-elevated)] z-50">
                <div className="px-4 py-3 border-b border-[var(--border-light)] flex items-center justify-between">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>{t.admin.layout?.notificationsTitle || 'Notifications'}</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[11px] hover:underline" style={{ color: 'var(--accent)' }}>
                      {t.admin.layout?.markAllRead || 'Mark all read'}
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                    {t.admin.layout?.noNotifications || 'No new notifications'}
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`px-4 py-3 border-b border-[var(--border-light)] cursor-pointer hover:bg-[var(--surface-hover)] ${!n.read ? 'bg-[rgba(59,130,246,0.05)]' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${n.type === 'order' ? 'bg-[var(--accent)]' : 'bg-[var(--warning)]'}`} />
                        <span className="text-[12px] font-medium" style={{ color: 'var(--fg)' }}>{n.title}</span>
                        <span className="text-[10px] ml-auto" style={{ color: 'var(--fg-muted)' }}>
                          {new Date(n.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[12px] pl-4" style={{ color: 'var(--fg-secondary)' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="avatar"
              >
                AD
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-elevated)] py-1 z-50">
                  <div className="px-4 py-3 border-b border-[var(--border-light)]">
                    <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>{t.admin.layout?.profileName || 'Admin User'}</div>
                    <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>{t.admin.layout?.profileEmail || 'admin@localplug.com'}</div>
                  </div>
                  <Link href="/reset-password" className="block px-4 py-2 text-[13px] hover:bg-[var(--surface-hover)]" style={{ color: 'var(--fg-secondary)' }}>
                    {t.admin.layout?.resetPassword || 'Reset Password'}
                  </Link>
                  <button onClick={() => signOut({ redirectUrl: '/sign-in' })} className="block w-full px-4 py-2 text-[13px] text-left hover:bg-[var(--surface-hover)]" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                    {t.admin.nav.signOut as string}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Global Date Navigation ── */}
        <DateNav />

        <div className="content">
          {children}
        </div>
      </div>
      <InactivityGuard />
      <ToastContainer />
    </div>
  )
}
