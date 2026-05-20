'use client'

import { useI18n } from '@/lib/i18n'

function TestimonialsInner() {
  const { t } = useI18n()

  return (
    <section id="testimonials" className="py-[120px] bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" />
            {t.testimonials.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.testimonials.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.testimonials.subtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {t.testimonials.items.map((item) => (
            <article
              key={item.author}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-gold)]"
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-dark)] flex items-center justify-center text-[var(--bg-dark)] font-bold text-lg">
                  {item.author.charAt(0)}
                </div>
                <div>
                  <strong className="block text-base font-semibold text-white">{item.author}</strong>
                  <span className="text-xs text-yellow-400 tracking-widest">
                    {'★★★★★'}
                  </span>
                </div>
              </div>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </p>
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
