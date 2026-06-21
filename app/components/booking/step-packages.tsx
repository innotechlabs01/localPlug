'use client'

import { useI18n } from '@/lib/i18n'

interface StepPackagesProps {
  value: string
  onChange: (value: string) => void
  config?: BookingConfig | null
}

interface BookingConfig {
  packages: Record<string, { name: string; price: number }>
  returnTripCharge: number
  serviceFee: number
  taxRate: number
  currency: string
  advanceBookingDays: number
}

const packageIds = ['smooth-landing', 'first-24', 'full-insider'] as const

const popularFlags: Record<string, boolean> = {
  'smooth-landing': false,
  'first-24': true,
  'full-insider': false,
}

export default function StepPackages({
  value,
  onChange,
  config,
}: StepPackagesProps) {
  const { t } = useI18n()
  const pkgT = t.booking.steps.packages

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{pkgT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-8">
        {pkgT.subtitle}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {packageIds.map((pkgId) => {
          const selected = value === pkgId
          const pkgData = pkgT.packages[pkgId as keyof typeof pkgT.packages]
          const price = config?.packages?.[pkgId]?.price ?? 0
          const isPopular = popularFlags[pkgId]
          const isElite = pkgId === 'full-insider'

          return (
            <button
              key={pkgId}
              type="button"
              onClick={() => onChange(pkgId)}
              className={`relative flex flex-col gap-3.5 p-5 rounded-[var(--radius-lg)] border-[1.5px] cursor-pointer transition-all duration-250 ${
                selected
                  ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)] shadow-[0_0_0_1px_rgba(212,165,116,0.25)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-light)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-[10px] right-3 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-light)] text-[var(--bg-dark)] text-[9px] font-bold uppercase tracking-[0.5px] px-2.5 py-1 rounded-[10px] z-10">
                  {pkgT.moreSold}
                </span>
              )}
              {isElite && !isPopular && (
                <span className="absolute -top-[10px] right-3 bg-gradient-to-r from-[var(--accent-gold)] to-[#f5d98a] text-[var(--bg-dark)] text-[9px] font-bold uppercase tracking-[0.5px] px-2.5 py-1 rounded-[10px] z-10">
                  Elite VIP
                </span>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[28px] font-bold tracking-[-0.03em] text-white leading-none mb-0.5">
                    ${price} <span className="text-[14px] font-normal text-[var(--text-muted)]">USD</span>
                  </div>
                  <div className="text-[15px] font-semibold text-white mt-1">{pkgData.name}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                  selected
                    ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]'
                    : 'border-[var(--border)]'
                }`}>
                  {selected && (
                    <div className="w-2 h-2 rounded-full bg-[var(--bg-dark)]" />
                  )}
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {pkgData.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)] leading-[1.4]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" className="shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
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
