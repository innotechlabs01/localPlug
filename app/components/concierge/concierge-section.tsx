'use client'

import ConciergeCard from './concierge-card'
import { useI18n } from '@/lib/i18n'

const icons = [
  <svg key="safety" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>,
  <svg key="logistics" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>,
  <svg key="connectivity" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
    <path d="M9 16h4" />
  </svg>,
]

function ConciergeInner() {
  const { t } = useI18n()
  const advantages = t.concierge.items.map((item, i) => ({
    ...item,
    icon: icons[i],
  }))

  return (
    <section id="services" className="py-[120px]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" />
            Our Services
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-medium tracking-tight text-white mb-4 text-balance">
            {t.concierge.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">{t.concierge.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {advantages.map((adv) => (
            <ConciergeCard
              key={adv.title}
              title={adv.title}
              description={adv.description}
              icon={adv.icon}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ConciergeSection() {
  return <ConciergeInner />
}
