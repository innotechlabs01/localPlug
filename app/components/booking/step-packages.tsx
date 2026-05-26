'use client'

import { useI18n } from '@/lib/i18n'

interface StepPackagesProps {
  value: string
  onChange: (value: string) => void
}

const packageIds = ['smooth-landing', 'first-24', 'full-insider'] as const

const packagePrices: Record<string, number> = {
  'smooth-landing': 89,
  'first-24': 159,
  'full-insider': 269,
}

const popularFlags: Record<string, boolean> = {
  'smooth-landing': false,
  'first-24': true,
  'full-insider': false,
}

export default function StepPackages({
  value,
  onChange,
}: StepPackagesProps) {
  const { t } = useI18n()
  const pkgT = t.booking.steps.packages

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{pkgT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-8">
        {pkgT.subtitle}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {packageIds.map((pkgId) => {
          const selected = value === pkgId
          const pkgData = pkgT.packages[pkgId as keyof typeof pkgT.packages]
          const price = packagePrices[pkgId]
          const isPopular = popularFlags[pkgId]

          return (
            <button
              key={pkgId}
              type="button"
              onClick={() => onChange(pkgId)}
              className={`relative text-left p-7 rounded-[var(--radius-xl)] border-2 transition-all duration-200 ${
                selected
                  ? 'border-[var(--accent-gold)] bg-gradient-to-b from-[rgba(212,165,116,0.08)] to-[var(--bg-card)] shadow-[0_0_60px_rgba(212,165,116,0.15)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-light)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold-gradient text-[var(--bg-dark)] text-label-sm font-bold px-4 py-1.5 rounded-full shadow-[0_2px_8px_rgba(212,165,116,0.3)] whitespace-nowrap z-10">
                  {pkgT.moreSold}
                </span>
              )}

              <div className={`${isPopular ? 'mt-2' : ''}`}>
                <h3 className="text-display-md text-white font-bold mb-1.5">
                  {pkgData.name}
                </h3>
                <p className="text-label-sm text-[var(--text-muted)] uppercase tracking-wider font-medium mb-5">
                  {pkgData.subtitle}
                </p>

                <div className="flex items-baseline gap-0.5 mb-6">
                  <span className="text-4xl font-bold text-white">
                    ${price}
                  </span>
                  <span className="text-body-md text-[var(--text-muted)] ml-1">
                    USD
                  </span>
                </div>

                <div className="border-t border-[var(--border)] pt-5">
                  <ul className="space-y-3.5">
                    {pkgData.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-3 text-body-md text-[var(--text-secondary)]">
                        <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                          selected
                            ? 'bg-[rgba(212,165,116,0.15)] text-[var(--accent-gold)]'
                            : 'bg-[var(--surface)] text-[var(--text-muted)]'
                        }`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
        <span className="flex items-center gap-2 text-body-md text-[var(--text-secondary)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z" />
            <polyline points="9 11 12 14 22 4" />
          </svg>
          {pkgT.freeCancellation}
        </span>
        <span className="flex items-center gap-2 text-body-md text-[var(--text-secondary)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {pkgT.whatsappConcierge}
        </span>
      </div>
    </div>
  )
}
