'use client'

import { useI18n } from '@/lib/i18n'
import type { DestinationData } from './lib/types'

interface StepPackagesProps {
  value: string
  onChange: (value: string) => void
  destination: DestinationData
  onDestinationChange: (data: DestinationData) => void
  config?: BookingConfig | null
}

interface BookingConfig {
  packages: Record<string, {
    name: string
    base_price_usd?: number
    price?: number
    service_fee_flat?: number
    price_per_person_usd?: number
    features?: string[]
    tours?: Array<{ id: number; name: string; description?: string; price_per_person_usd: number; vehicle_type?: string; duration_hours?: number }>
    is_popular?: boolean
  }>
  returnTripCharge: number
  serviceFee: number
  taxRate: number
  currency: string
  advanceBookingDays: number
  trips?: Array<{ id: string; name: string; price_per_person_usd: number }>
  trm?: number
}

export default function StepPackages({
  value,
  onChange,
  destination,
  onDestinationChange,
  config,
}: StepPackagesProps) {
  const { t } = useI18n()
  const pkgT = t.booking.steps.packages
  const destT = t.booking.steps.destination
  const currency = config?.currency?.toUpperCase() || 'USD'

  const selectedPackageConfig = value ? config?.packages?.[value] : null
  const pkgTours = selectedPackageConfig?.tours ?? []
  const hasTours = pkgTours.length > 0
  const numPeople = Math.max(1, Math.floor(destination.numPeople || 1))
  const selectedTrips = destination.additionalTrips ?? []

  const tripPrices: Record<string, number> = {}
  pkgTours.forEach((tour) => {
    tripPrices[String(tour.id)] = Number(tour.price_per_person_usd) || 0
  })

  const setNumPeople = (val: number) => {
    const clamped = Math.min(50, Math.max(1, Math.floor(val || 1)))
    onDestinationChange({ ...destination, numPeople: clamped })
  }

  const toggleTrip = (tripId: string) => {
    const current = selectedTrips
    const next = current.includes(tripId)
      ? current.filter((id) => id !== tripId)
      : [...current, tripId]
    onDestinationChange({ ...destination, additionalTrips: next })
  }

  const getTripLabel = (tripId: string, tourName: string) => {
    const tripLabels = t.booking.steps.destination.trips
    return tripLabels[tripId as keyof typeof tripLabels] || tourName || tripId
  }

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{pkgT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-8">
        {pkgT.subtitle}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {Object.keys(config?.packages || {}).map((pkgId) => {
          const selected = value === pkgId
          const pkgConfig = config?.packages?.[pkgId]
          const pkgData = pkgT.packages[pkgId as keyof typeof pkgT.packages]
          const price = pkgConfig?.base_price_usd ?? pkgConfig?.price ?? 0
          const features = pkgConfig?.features || pkgData.features || []
          const isPopular = pkgConfig?.is_popular ?? false
          const isElite = pkgId === 'full-insider'

          return (
            <button
              key={pkgId}
              type="button"
              onClick={() => onChange(pkgId)}
              className={`relative flex flex-col gap-3.5 p-5 rounded-[var(--radius-lg)] border-[1.5px] cursor-pointer transition-all duration-200 ${
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
                    ${price} <span className="text-[14px] font-normal text-[var(--text-muted)]">{currency}</span>
                  </div>
                  {config?.trm && (
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {(price * Number(config.trm)).toLocaleString('es-CO')} COP
                    </div>
                  )}
                  <div className="text-[15px] font-semibold text-white mt-1">{pkgData?.name || pkgId}</div>
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
                {features.map((f: string) => (
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

      {/* ---- Dynamic section shown after package selection ---- */}
      {value && (
        <div className="border-t border-[var(--border)] pt-8">
          {/* NumPeople — shown for ALL plans */}
          <div className="mb-8">
            <p className="text-label-md text-[var(--text-primary)] mb-3">
              {destT.numPeople}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setNumPeople(numPeople - 1)}
                  className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                  aria-label="Decrease travelers"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span className="w-12 text-center text-body-md font-semibold text-white">{numPeople}</span>
                <button
                  type="button"
                  onClick={() => setNumPeople(numPeople + 1)}
                  className="w-11 h-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                  aria-label="Increase travelers"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
              {hasTours && selectedTrips.length > 0 && (
                <div className="text-[13px] text-[var(--text-secondary)]">
                  {t.booking.steps.payment.summaryExperiences}:{' '}
                  <span className="font-semibold text-[var(--accent-gold)]">
                    ${selectedTrips.reduce((sum, id) => {
                      const tour = pkgTours.find((t) => String(t.id) === id || t.name === id)
                      const price = tour?.price_per_person_usd ?? 0
                      return sum + price * numPeople
                    }, 0).toFixed(2)} USD
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tours — shown ONLY for the plan that includes tours (full-insider) */}
          {hasTours && (
            <div className="border-t border-[var(--border)] pt-6">
              <p className="text-label-md text-[var(--text-primary)] mb-4">
                {destT.additionalTrips}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pkgTours.map((tour) => {
                  const tripId = String(tour.id)
                  const selected = selectedTrips.includes(tripId)
                  const price = Number(tour.price_per_person_usd) || 0
                  return (
                    <label
                      key={tripId}
                      className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all duration-200 ${
                        selected
                          ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)]'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-light)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleTrip(tripId)}
                        className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20 focus:ring-2 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`flex-1 text-body-md ${selected ? 'text-[var(--accent-gold)] font-medium' : 'text-[var(--text-primary)]'}`}>
                          {getTripLabel(tripId, tour.name)}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-white shrink-0">
                        ${price.toFixed(2)}
                        <span className="text-[11px] font-normal text-[var(--text-muted)]"> {destT.perPerson}</span>
                        {config?.trm && (
                          <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">
                            ({(price * Number(config.trm)).toLocaleString('es-CO')} COP)
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center mt-8">
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