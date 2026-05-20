'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'

interface NavItem {
  labelKey: string
  href: string
  icon: React.ReactNode
  badge?: string
}

const navSections: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: 'sectionOverview',
    items: [
      { labelKey: 'dashboard', href: '/admin', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
      { labelKey: 'orderQueue', href: '/admin/orders', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
      { labelKey: 'monthlyAgenda', href: '/admin/agenda', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
      { labelKey: 'iaChatCenter', href: '/admin/ia-chat', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
      { labelKey: 'intelligence', href: '/admin/intelligence', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    ],
  },
  {
    labelKey: 'sectionManagement',
    items: [
      { labelKey: 'clients', href: '/admin/customers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
      { labelKey: 'employees', href: '/admin/employees', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
      { labelKey: 'teamHub', href: '/admin/team', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    ],
  },
  {
    labelKey: 'sectionOperations',
    items: [
      { labelKey: 'dispatch', href: '/admin/dispatch', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> },
      { labelKey: 'logistics', href: '/admin/logistics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
      { labelKey: 'gridOps', href: '/admin/grid', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-[#0b0d14] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 w-[240px] bg-[#111318] border-r border-[#282b38] flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center gap-3 px-4 border-b border-[#282b38] shrink-0">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-bold text-[15px] shrink-0">
            LP
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-[#f0f2f5]">LocalPlug</div>
            <div className="text-[11px] text-[#646880] uppercase tracking-[0.3px]">Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.labelKey}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.8px] text-[#646880] px-3 pt-5 pb-1.5">
                {t.admin.nav[section.labelKey as keyof typeof t.admin.nav] as string}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13.5px] font-medium transition-all duration-200 relative ${
                      isActive
                        ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                        : 'text-[#9ca0b0] hover:bg-[#202330] hover:text-[#f0f2f5]'
                    }`}
                  >
                    <span className="shrink-0 opacity-70">{item.icon}</span>
                    <span>{t.admin.nav[item.labelKey as keyof typeof t.admin.nav] as string}</span>
                    {item.badge && (
                      <span className="ml-auto bg-[#ef4450] text-white text-[11px] font-semibold px-[7px] py-px rounded-[10px] min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-2 border-t border-[#282b38]">
          <Link
            href="/sign-in"
            className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13.5px] font-medium text-[#9ca0b0] hover:bg-[#202330] hover:text-[#f0f2f5] transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t.admin.nav.signOut as string}
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-[60px] bg-[#111318] border-b border-[#282b38] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 backdrop-blur-[12px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden w-9 h-9 rounded-[6px] flex items-center justify-center text-[#9ca0b0] hover:bg-[#202330] hover:text-[#f0f2f5] transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="relative search-input w-[200px] hidden sm:block">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#646880]">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 bg-[#0b0d14] border border-[#282b38] rounded-[6px] text-[13px] text-[#f0f2f5] placeholder:text-[#646880] outline-none focus:border-[#10b981] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-[6px] flex items-center justify-center text-[#9ca0b0] hover:bg-[#202330] hover:text-[#f0f2f5] transition-all relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4450] border-2 border-[#111318]" />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white font-semibold text-[13px] cursor-pointer hover:opacity-80 transition-opacity"
              >
                A
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-[200px] bg-[#181b25] border border-[#282b38] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.4)] py-1 z-50">
                  <div className="px-4 py-3 border-b border-[#282b38]">
                    <div className="text-[13px] font-medium text-[#f0f2f5]">Admin User</div>
                    <div className="text-[11px] text-[#646880]">admin@localplug.com</div>
                  </div>
                  <Link href="/reset-password" className="block px-4 py-2 text-[13px] text-[#9ca0b0] hover:bg-[#202330] hover:text-[#f0f2f5] transition-colors">
                    Reset Password
                  </Link>
                  <Link href="/sign-in" className="block px-4 py-2 text-[13px] text-[#ef4450] hover:bg-[#202330] transition-colors">
                    Sign Out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
