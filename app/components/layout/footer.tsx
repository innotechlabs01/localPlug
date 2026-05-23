'use client'

import { useI18n } from '@/lib/i18n'

function FooterInner() {
  const { t } = useI18n()

  return (
    <footer className="bg-[var(--bg-card)] border-t border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[60px] mb-[60px]">
          <div className="lg:col-span-1">
            <h3 className="font-display text-2xl font-semibold text-white mb-4">
              Medellín{' '}
              <span className="text-[var(--accent-gold)]">Premium</span>
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[280px]">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-5">{t.footer.quickLinks}</h4>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">
                  {t.footer.links.airportTransfer}
                </a>
              </li>
              <li>
                <a href="#experiences" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">
                  {t.footer.links.cityTours}
                </a>
              </li>
              <li>
                <a href="#experiences" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">
                  {t.footer.links.guatapeTrips}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">
                  {t.footer.links.nightlifeVIP}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-5">{t.footer.company}</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">{t.footer.aboutUs}</a></li>
              <li><a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">{t.footer.contactUs}</a></li>
              <li><a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">{t.footer.careers}</a></li>
              <li><a href="#" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">{t.footer.press}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-5">{t.footer.contact}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                  <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{t.footer.address}</span>
              </li>
              <li>
                <a href="mailto:hello@medellinwithoutstress.com" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4L12 13 2 4" />
                  </svg>
                  hello@medellinwithoutstress.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">
            {t.footer.copyright.replace('{year}', String(new Date().getFullYear()))}
          </p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="w-10 h-10 rounded-full bg-[var(--glass)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-gold)] hover:text-[var(--bg-dark)] transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-[var(--glass)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-gold)] hover:text-[var(--bg-dark)] transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="18" cy="6" r="1.5"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-[var(--glass)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-gold)] hover:text-[var(--bg-dark)] transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Footer() {
  return <FooterInner />
}
