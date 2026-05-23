'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { useRealtime } from '@/lib/admin/realtime-context'

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
        href: '/admin/orders',
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
        href: '/admin/logistics',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 17h14M5 17a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2M8 21h8"/>
            <circle cx="7" cy="14" r="2"/><circle cx="17" cy="14" r="2"/>
          </svg>
        ),
        badge: '26',
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
        href: '/admin/team',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        labelKey: 'analytics',
        href: '/admin/intelligence',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        ),
      },
      {
        labelKey: 'payments',
        href: '/admin/grid',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        ),
      },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { t } = useI18n()
  const { notifications, unreadCount, markAsRead, markAllAsRead, stats } = useRealtime()

  const pageTitle = t.admin.dashboard.title as string

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
          {navSections.map((section) => (
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
                      <span className="nav-badge">{item.href === '/admin/dispatch' ? stats.pending_dispatch : item.badge}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link href="/sign-in" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t.admin.nav.signOut as string}
          </Link>
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
            <span className="page-title">{pageTitle}</span>
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
            >
              <option>🇺🇸 EN</option>
              <option>🇪🇸 ES</option>
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
                  <Link href="/sign-in" className="block px-4 py-2 text-[13px] hover:bg-[var(--surface-hover)]" style={{ color: 'var(--danger)' }}>
                    {t.admin.nav.signOut as string}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </div>
    </div>
  )
}
