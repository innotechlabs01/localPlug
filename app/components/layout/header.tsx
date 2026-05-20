'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/app/components/ui/button'
import LangToggle from '@/app/components/ui/lang-toggle'
import { useI18n } from '@/lib/i18n'

function HeaderInner() {
  const { t } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: t.nav.services, href: '#services' },
    { label: t.nav.experiences, href: '#experiences' },
    { label: t.nav.howItWorks, href: '#why-us' },
    { label: t.nav.pricing, href: '#pricing' },
    { label: t.nav.testimonials, href: '#testimonials' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(10,10,10,0.95)] backdrop-blur-xl'
          : 'bg-[rgba(10,10,10,0.85)] backdrop-blur-xl'
      } border-b border-[var(--border)]`}
    >
      <nav className="mx-auto max-w-container px-4 md:px-12">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="font-display text-2xl font-semibold text-white no-underline whitespace-nowrap tracking-tight">
            Medellín{' '}
            <span className="text-accent-gold">Premium</span>
          </a>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <LangToggle />
            <Link href="/booking">
              <Button size="sm" variant="primary">
                {t.nav.planMyArrival}
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <LangToggle />
            <button
              className="p-2 rounded hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] text-[var(--text-secondary)]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? t.nav.close : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-body-md text-[var(--text-secondary)] hover:text-white transition-colors px-2 py-2 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link href="/booking" className="block mt-2">
                <Button size="sm" variant="primary" className="w-full">
                  {t.nav.planMyArrival}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default function Header() {
  return <HeaderInner />
}
