// app/components/testimonials/testimonials-section.tsx
'use client'

import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'
import RatingsProvider from '@/app/components/ratings/RatingsProvider'
import RatingStats from '@/app/components/ratings/RatingStats'
import TestimonialsSlider from '@/app/components/ratings/TestimonialsSlider'

function TestimonialsInner() {
  const { t } = useI18n()
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()

  return (
    <section id="testimonials" className="py-[120px] bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div ref={headerRef} className={`text-center mb-16 reveal ${headerVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            {t.testimonials.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.ratings.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.testimonials.subtitle}
          </p>
        </div>

        <RatingStats />
        <TestimonialsSlider />
      </div>
    </section>
  )
}

export default function TestimonialsSection() {
  return (
    <RatingsProvider>
      <TestimonialsInner />
    </RatingsProvider>
  )
}
