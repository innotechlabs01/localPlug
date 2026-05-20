'use client'

import { useI18n } from '@/lib/i18n'

const serviceIcons = [
  <svg key="flight" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>,
  <svg key="target" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>,
  <svg key="landmark" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
  </svg>,
  <svg key="food" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
  </svg>,
  <svg key="phone" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h4" />
  </svg>,
  <svg key="package" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h6v16H2V4h2M8 4V2h8v2M4 8h16" /><rect x="8" y="10" width="8" height="6" rx="1" />
  </svg>,
  <svg key="shield" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
  <svg key="dollar" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>,
]

function AboutInner() {
  const { t } = useI18n()
  const services = t.about.services

  return (
    <section id="services" className="py-[120px] bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" />
            {t.about.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.about.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.about.subtitleAlt}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((svc, i) => (
            <div key={svc.title} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 transition-all duration-300 hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-gold)] hover:-translate-y-1 cursor-pointer">
              <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[rgba(212,165,116,0.15)] flex items-center justify-center mb-5 text-[var(--accent-gold)] text-2xl">
                {serviceIcons[i]}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2.5">{svc.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{svc.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function AboutSection() {
  return <AboutInner />
}
