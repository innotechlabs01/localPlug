'use client'

import Link from 'next/link'
import Button from '@/app/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'

const prices = [89, 159, 269]

export default function PricingSection() {
  const { t } = useI18n()
  const plans = t.pricing.plans
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal({ threshold: 0.1 })

  return (
    <section id="pricing" className="py-[120px]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div ref={headerRef} className={`text-center mb-16 reveal ${headerVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            {t.pricing.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>

        <div ref={gridRef} className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto stagger-children ${gridVisible ? 'visible' : ''}`}>
          {plans.map((plan, i) => {
            const isPopular = i === 1
            return (
              <article
                key={plan.name}
                className={`relative bg-[var(--bg-card)] border rounded-[var(--radius-xl)] p-10 transition-all duration-300 hover:-translate-y-1 ${
                  isPopular
                    ? 'border-[var(--accent-gold)] bg-gradient-to-b from-[rgba(212,165,116,0.08)] to-[var(--bg-card)] shadow-[0_0_60px_rgba(212,165,116,0.15)] hover:shadow-[0_0_80px_rgba(212,165,116,0.2)]'
                    : 'border-[var(--border)] hover:border-[var(--accent-gold)] hover:shadow-[0_12px_40px_rgba(212,165,116,0.1)]'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-[var(--bg-dark)] px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[.05em] shadow-[0_2px_8px_rgba(212,165,116,0.3)]">
                    {t.pricing.popular}
                  </span>
                )}

                <h3 className="text-[22px] font-semibold text-white mb-2">{plan.name}</h3>
                <div className="text-[42px] font-bold text-[var(--accent-gold)] mb-2">
                  ${prices[i]}
                  <span className="text-[15px] text-[var(--text-muted)] font-normal"> {t.pricing.starting}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-7">{plan.desc}</p>

                <ul className="space-y-1 mb-8" role="list">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-center gap-3 py-2.5 text-sm text-[var(--text-secondary)] border-b border-[var(--border)]">
                      <span className="w-5 h-5 rounded-full bg-[rgba(212,165,116,0.2)] text-[var(--accent-gold)] flex items-center justify-center text-[11px] shrink-0" aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/booking" className="block">
                  <Button variant={isPopular ? 'primary' : 'secondary'} className="w-full">
                    {t.pricing.selectPlan}
                  </Button>
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
