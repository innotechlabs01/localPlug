'use client'

import { useI18n } from '@/lib/i18n'

export default function StatsBar() {
  const { t } = useI18n()

  const stats = [
    { num: '2,400+', label: t.stats.travelers },
    { num: '98.7%', label: t.stats.onTime },
    { num: '50+', label: t.stats.experiences },
    { num: '24/7', label: t.stats.support },
  ]

  return (
    <section className="py-16 bg-[var(--bg-card)] border-t border-[var(--border)] border-b border-[var(--border)]">
      <div className="mx-auto max-w-container px-4 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {stats.map((s) => (
            <div key={s.num} className="px-4 py-2">
              <div className="font-display text-5xl font-semibold bg-gradient-to-br from-[var(--accent-gold-light)] to-[var(--accent-gold)] bg-clip-text text-transparent leading-none mb-2">
                {s.num}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
