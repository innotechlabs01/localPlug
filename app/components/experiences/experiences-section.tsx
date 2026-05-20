'use client'

import { useI18n } from '@/lib/i18n'
import Link from 'next/link'

const experienceImages = [
  'https://images.unsplash.com/photo-1575468138804-7a1d2e9c0e9f?w=800&q=80',
  'https://images.unsplash.com/photo-1589487391820-2d1c5e394f3f?w=800&q=80',
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80',
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
  'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800&q=80',
]

export default function ExperiencesSection() {
  const { t } = useI18n()
  const items = t.experiences.items

  return (
    <section id="experiences" className="py-[120px] bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-[.15em] uppercase text-[var(--accent-gold)] mb-4">
            <span className="w-7 h-[2px] bg-[var(--accent-gold)] rounded" />
            {t.experiences.tag}
          </div>
          <h2 className="font-display text-[clamp(36px,5vw,52px)] font-semibold tracking-tight text-white mb-4">
            {t.experiences.title}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto">
            {t.experiences.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((exp, i) => {
            const isFeatured = exp.popular || false
            return (
              <Link
                key={exp.name}
                href="/booking"
                className={`group relative rounded-[var(--radius-xl)] overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  isFeatured ? 'md:col-span-2 md:row-span-2' : ''
                }`}
                style={{ aspectRatio: isFeatured ? undefined : '4/5' }}
              >
                <img
                  src={experienceImages[i]}
                  alt={exp.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ position: 'absolute', inset: 0 }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
                {exp.popular && (
                  <span className="absolute top-5 left-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.05em] text-white">
                    {t.experiences.popular}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <div className="experience-info">
                    <h3 className={`font-semibold text-white mb-1.5 ${isFeatured ? 'text-3xl' : 'text-2xl'}`}>
                      {exp.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {exp.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
