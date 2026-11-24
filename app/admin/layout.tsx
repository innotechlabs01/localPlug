'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useClerk, useUser } from '@clerk/nextjs'
import { useI18n } from '@/lib/i18n'
import { RealtimeProvider, useRealtime } from '@/lib/admin/realtime-context'
import { InactivityGuard } from '@/app/admin/components/InactivityGuard'
import { ToastProvider, useToast } from '@/lib/admin/toast-context'
import { DateFilterProvider, useDateFilter } from '@/lib/admin/date-filter-context'
import './ui.css'

interface NavItem {
  labelKey?: string
  label?: string
  href: string
  moduleSlug: string
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
        moduleSlug: 'dashboard',
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
        moduleSlug: 'dispatch',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
          </svg>
        ),
      },
      {
        label: 'Maps',
        href: '/admin/maps',
        moduleSlug: 'dispatch',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
        ),
      },
    ],
  },
  {
    labelKey: 'sectionOperations',
    items: [
      {
        labelKey: 'reservations',
        href: '/admin/reservations',
        moduleSlug: 'reservations',
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
        moduleSlug: 'drivers',
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
        moduleSlug: 'fleet',
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
        moduleSlug: 'customers',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        ),
      },
      {
        labelKey: 'support',
        href: '/admin/ia-chat',
        moduleSlug: 'support',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
      },
      {
        label: 'Auditoría',
        href: '/admin/auditoria',
        moduleSlug: 'audit',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        ),
      },
      {
        label: 'Event Queue',
        href: '/admin/outbox',
        moduleSlug: 'queue',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        ),
      },
    ],
  },
  {
    labelKey: 'sectionManagement',
    items: [
      {
        labelKey: 'employees',
        href: '/admin/employees',
        moduleSlug: 'employees',
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
        moduleSlug: 'analytics',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        ),
      },
      {
        labelKey: 'payments',
        href: '/admin/payments',
        moduleSlug: 'payments',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        ),
      },
      {
        labelKey: 'settlements',
        href: '/admin/settlements',
        moduleSlug: 'payouts',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1v22"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        ),
      },
      {
        labelKey: 'parking',
        href: '/admin/parking-proofs',
        moduleSlug: 'parking_proofs',
        icon: (          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            <path d="M2 12h6"/>
            <path d="M12 8v8"/>
          </svg>
        ),
      },
      {
        labelKey: 'plans',
        href: '/admin/plans',
        moduleSlug: 'plans',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
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
        moduleSlug: 'hotels',
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
      {
        labelKey: 'events',
        href: '/admin/events',
        moduleSlug: 'events',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="8" y1="14" x2="8.01" y2="14"/>
            <line x1="12" y1="14" x2="16" y2="14"/>
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
  const { user } = useUser()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [permsLoading, setPermsLoading] = useState(true)
  const [userPerms, setUserPerms] = useState<Record<string, { can_view?: boolean }>>({})
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const { t, lang, setLang } = useI18n()
  const { notifications, unreadCount, markAsRead, markAllAsRead, stats } = useRealtime()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setNotifOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const [permError, setPermError] = useState<string | null>(null)

  const loadPermissions = useCallback(() => {
    if (!isLoaded || !isSignedIn) return
    setPermsLoading(true)
    setAccessDenied(false)
    setPermError(null)
    fetch('/api/admin/permissions/mine', { cache: 'no-store' })
      .then(async r => {
        if (r.status === 401) {
          router.push('/sign-in/admin')
          return null
        }
        if (r.status === 403) {
          const err = await r.json().catch(() => ({}))
          setPermError(err.error || 'Sin permisos asignados para el panel admin.')
          setAccessDenied(true)
          return null
        }
        if (!r.ok) {
          setPermError(`Error ${r.status} verificando permisos.`)
          setAccessDenied(true)
          return null
        }
        return r.json()
      })
      .then(data => {
        if (!data) return
        const perms: Record<string, { can_view?: boolean }> = data.permissions || {}
        const superAdmin = Boolean(data.isSuperAdmin)
        setUserPerms(perms)
        setIsSuperAdmin(superAdmin)
        const hasAnyView = superAdmin || Object.values(perms).some(p => Boolean(p?.can_view))
        if (!hasAnyView) {
          setPermError('Tu rol no tiene módulos activos (Menu/View) en el panel admin.')
          setAccessDenied(true)
        }
      })
      .catch(() => {
        setPermError('Error de red al verificar permisos.')
        setAccessDenied(true)
      })
      .finally(() => setPermsLoading(false))
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setPermsLoading(false)
      return
    }
    loadPermissions()
  }, [isLoaded, isSignedIn, user?.id, loadPermissions])

  const filteredNavSections = navSections
    .map(s => {
      const items = [...s.items]
      if (s.labelKey === 'sectionManagement' && isSuperAdmin) {
        items.push({
          labelKey: 'roles',
          href: '/admin/roles',
          moduleSlug: 'roles',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          ),
        })
      }
      const visibleItems = isSuperAdmin
        ? items
        : items.filter(item => Boolean(userPerms[item.moduleSlug]?.can_view))
      return { ...s, items: visibleItems }
    })
    .filter(s => s.items.length > 0)

  if (isLoaded && !isSignedIn) {
    router.push('/sign-in/admin')
    return null
  }

  if (!isLoaded || permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--ui-bg)' }}>
        <div className="text-center" style={{ color: 'var(--ui-fg-secondary)' }}>
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: 'var(--ui-border)', borderTopColor: 'var(--ui-accent)' }} />
          Loading...
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--ui-bg)' }}>
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ui-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="text-[20px] font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-[14px] text-[var(--ui-fg-secondary)] leading-relaxed mb-3">
            {permError || 'Your account does not have the necessary permissions to access the admin panel.'}
          </p>
          {user?.primaryEmailAddress?.emailAddress && (
            <p className="text-[12px] text-[var(--ui-fg-muted)] mb-6">
              Cuenta actual: <strong className="text-[var(--ui-fg)]">{user.primaryEmailAddress.emailAddress}</strong>
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={loadPermissions}
              className="px-5 py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={{ background: 'var(--ui-surface)', color: 'var(--ui-fg)', border: '1px solid var(--ui-border)' }}
            >
              Reintentar
            </button>
            <button
              onClick={() => signOut({ redirectUrl: '/sign-in/admin' })}
              className="px-6 py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--ui-danger)', border: '1px solid var(--ui-danger)' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getPageTitle = (): string => {
    const titleMap: Record<string, string> = {
      '/admin': t.admin.dashboard.title as string,
      '/admin/dispatch': t.admin.nav.dispatch as string,
      '/admin/maps': 'Live GPS Map',
      '/admin/drivers': t.admin.nav.drivers as string,
      '/admin/fleet': t.admin.nav.fleet as string,
      '/admin/customers': t.admin.nav.customers as string,
      '/admin/ia-chat': t.admin.nav.support as string,
      '/admin/employees': t.admin.nav.employees as string,
      '/admin/analytics': t.admin.nav.analytics as string,
      '/admin/payments': t.admin.nav.payments as string,
      '/admin/parking-proofs': t.admin.nav.parking as string,
      '/admin/auditoria': 'Auditoría',
      '/admin/outbox': 'Event Queue & Outbox',
      '/admin/agenda': 'Agenda',
      '/admin/cases': 'Cases',
      '/admin/roles': t.admin.nav.roles as string,
      '/admin/reservations': t.admin.nav.reservations as string,
      '/admin/plans': (t.admin.nav.plans as string) || 'Plans',
      '/admin/hotels': (t.admin.nav.hotels as string) || 'Hotels',
      '/admin/events': (t.admin.nav.events as string) || 'Events',
      '/admin/settlements': (t.admin.nav.settlements as string) || 'Settlements',
      '/admin/settings': 'Settings',
    }
    return titleMap[pathname] || t.admin.dashboard.title as string
  }

  return (
    <div className="admin-app admin-layout">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="admin-sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">M</div>
          <div className="admin-sidebar-brand">
            {t.admin.layout?.sidebarBrandTitle || 'Medellín Admin'}
            <small>{t.admin.layout?.sidebarBrandSubtitle || 'Operations Platform'}</small>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {filteredNavSections.map((section) => (
            <div key={section.labelKey}>
              <div className="admin-nav-section-label">
                {t.admin.nav[section.labelKey as keyof typeof t.admin.nav] as string}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const itemLabel = item.label || (t.admin.nav[item.labelKey as keyof typeof t.admin.nav] as string)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!sidebarOpen ? itemLabel : undefined}
                    onClick={() => { if (isMobile) setSidebarOpen(false) }}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span>{itemLabel}</span>
                    {(() => {
                      const dynamicBadge = item.href === '/admin/dispatch'
                        ? (stats.pending_dispatch > 0 ? stats.pending_dispatch : null)
                        : item.href === '/admin/ia-chat'
                        ? (stats.pending_user_reply > 0 ? stats.pending_user_reply : null)
                        : (item.badge && item.badge !== '0' ? item.badge : null)
                      return dynamicBadge != null ? (
                        <span className="admin-nav-badge">{dynamicBadge}</span>
                      ) : null
                    })()}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={() => signOut({ redirectUrl: '/sign-in/admin' })} title={!sidebarOpen ? (t.admin.nav.signOut as string) : undefined} className="admin-nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'left' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="admin-sidebar-footer-label">{t.admin.nav.signOut as string}</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className={`admin-main ${sidebarOpen ? '' : 'admin-main-collapsed'}`}>
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="admin-menu-btn"
              aria-label="Toggle sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="admin-page-title">{getPageTitle()}</span>
            <span className="badge badge-accent" style={{ fontSize: 10 }}>
              {t.admin.dashboard.live as string}
            </span>
          </div>
          <div className="admin-topbar-right">
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
            <button className="icon-btn relative" onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}>
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
                onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
                className="avatar"
              >
                {user?.firstName?.charAt(0) || 'A'}{user?.lastName?.charAt(0) || 'D'}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-[220px] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-elevated)] py-1 z-50">
                  <div className="px-4 py-3 border-b border-[var(--border-light)]">
                    <div className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                      {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }} title={user?.primaryEmailAddress?.emailAddress || ''}>
                      {user?.primaryEmailAddress?.emailAddress || ''}
                    </div>
                  </div>
                  <Link href="/reset-password" className="block px-4 py-2 text-[13px] hover:bg-[var(--surface-hover)]" style={{ color: 'var(--fg-secondary)' }}>
                    {t.admin.layout?.resetPassword || 'Reset Password'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Global Date Navigation ── */}
        <DateNav />

        <div className="admin-content">
          {children}
        </div>
      </div>
      <InactivityGuard />
      <ToastContainer />
    </div>
  )
}
