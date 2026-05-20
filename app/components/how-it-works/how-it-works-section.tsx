'use client'

import StepCard from './step-card'
import { useI18n } from '@/lib/i18n'

function HowItWorksInner() {
  const { t } = useI18n()
  const steps = t.howItWorks.steps.map((step, i) => ({
    order: i + 1,
    ...step,
  }))

  return (
    <section id="why-us" className="py-[120px]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" />
            {t.howItWorks.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </div>
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="absolute top-10 left-[8%] right-[8%] h-[2px] hidden lg:block"
            style={{
              background: 'linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-gold) 25%, var(--border) 25%, var(--border) 50%, var(--accent-gold) 50%, var(--accent-gold) 75%, var(--border) 75%, var(--border) 100%)',
            }}
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
