'use client'

import { useI18n } from '@/lib/i18n'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'

function StarRating() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 out of 5 stars">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialsInner() {
  const { t } = useI18n()
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal({ threshold: 0.1 })

  return (
    <section id="testimonials" className="py-[120px] bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div ref={headerRef} className={`text-center mb-16 reveal ${headerVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            {t.testimonials.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.testimonials.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.testimonials.subtitle}
          </p>
        </div>
        <div ref={gridRef} className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto stagger-children ${gridVisible ? 'visible' : ''}`}>
          {t.testimonials.items.map((item) => (
            <article
              key={item.author}
              className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-gold)] hover:shadow-[0_12px_40px_rgba(212,165,116,0.1)]"
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-dark)] flex items-center justify-center text-[var(--bg-dark)] font-bold text-lg shrink-0" aria-hidden="true">
                  {item.author.charAt(0)}
                </div>
                <div>
                  <strong className="block text-base font-semibold text-white">{item.author}</strong>
                  <StarRating />
                </div>
              </div>
              <blockquote>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function TestimonialsSection() {
  return <TestimonialsInner />
}
