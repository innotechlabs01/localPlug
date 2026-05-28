'use client'

import { useI18n } from '@/lib/i18n'
import Link from 'next/link'
import Image from 'next/image'
import { useScrollReveal } from '@/app/hooks/use-scroll-reveal'

const experienceImages = [
  '/images/experiences-1.svg',
  '/images/experiences-2.svg',
  '/images/experiences-3.svg',
  '/images/experiences-4.svg',
  '/images/experiences-5.svg',
  '/images/experiences-6.svg',
]

export default function ExperiencesSection() {
  const { t } = useI18n()
  const items = t.experiences.items
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal()
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal({ threshold: 0.1 })

  return (
    <section id="experiences" className="py-[120px] bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div ref={headerRef} className={`text-center mb-16 reveal ${headerVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" aria-hidden="true" />
            {t.experiences.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.experiences.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.experiences.subtitle}
          </p>
        </div>

        <div ref={gridRef} className={`grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children ${gridVisible ? 'visible' : ''}`}>
          {items.map((exp, i) => {
            const isFeatured = exp.popular || false
            return (
              <Link
                key={exp.name}
                href="/booking"
                className={`group relative rounded-[var(--radius-xl)] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_16px_48px_rgba(212,165,116,0.15)] ${
                  isFeatured ? 'md:col-span-2 md:row-span-2' : ''
                }`}
                style={{ aspectRatio: isFeatured ? undefined : '4/5' }}
              >
                <Image
                  src={experienceImages[i]}
                  alt={exp.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes={isFeatured ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85 transition-opacity duration-300 group-hover:to-black/90" />
                {exp.popular && (
                  <span className="absolute top-5 left-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.05em] text-white">
                    {t.experiences.popular}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-7 transition-transform duration-300 group-hover:translate-y-[-4px]">
                  <h3 className={`font-semibold text-white mb-1.5 ${isFeatured ? 'text-3xl' : 'text-2xl'}`}>
                    {exp.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {exp.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
