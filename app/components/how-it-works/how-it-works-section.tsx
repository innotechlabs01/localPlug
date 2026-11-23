'use client'

import StepCard from './step-card'
import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'

function HowItWorksInner() {
  const { t } = useI18n()
  const steps = t.howItWorks.steps.map((step, i) => ({
    order: i + 1,
    ...step,
  }))
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal({ threshold: 0.1 })

  return (
    <section id="why-us" className="py-[120px]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div ref={headerRef} className={`text-center mb-16 reveal ${headerVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            {t.howItWorks.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-medium tracking-tight text-white mb-4 text-balance">
            {t.howItWorks.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </div>
        <div ref={gridRef} className={`relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children ${gridVisible ? 'visible' : ''}`}>
          <div className="absolute top-10 left-[8%] right-[8%] h-[2px] hidden lg:block"
            style={{
              background: 'linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-gold) 25%, var(--border) 25%, var(--border) 50%, var(--accent-gold) 50%, var(--accent-gold) 75%, var(--border) 75%, var(--border) 100%)',
            }}
            aria-hidden="true"
          />
          {steps.map((step) => (
            <StepCard
              key={step.order}
              order={step.order}
              title={step.title}
              description={step.description}
              icon={null}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HowItWorksSection() {
  return <HowItWorksInner />
}
