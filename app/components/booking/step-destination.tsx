'use client'

import { useI18n } from '@/lib/i18n'

interface DestinationData {
  hasPlace: boolean
  address: string
  wantsGuatape: boolean
  additionalTrips?: string[]
}

interface StepDestinationProps {
  data: DestinationData
  onChange: (data: DestinationData) => void
}

export default function StepDestination({ data, onChange }: StepDestinationProps) {
  const { t } = useI18n()
  const destT = t.booking.steps.destination

  const AVAILABLE_TRIPS = [
    { id: 'guatape', label: destT.trips.guatape },
    { id: 'comuna13', label: destT.trips.comuna13 },
    { id: 'coffee', label: destT.trips.coffee },
    { id: 'santa-fe', label: destT.trips['santa-fe'] },
    { id: 'paragliding', label: destT.trips.paragliding },
  ]

  const togglePlace = (value: boolean) => {
    onChange({ ...data, hasPlace: value, address: value ? data.address : '' })
  }

  const toggleTrip = (tripId: string) => {
    const current = data.additionalTrips ?? []
    const next = current.includes(tripId)
      ? current.filter((id) => id !== tripId)
      : [...current, tripId]
    onChange({ ...data, additionalTrips: next })
  }

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{destT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-8">
        {destT.subtitle}
      </p>

      <div className="space-y-6">
        <div>
          <p className="text-label-md text-[var(--text-primary)] mb-3">
            {destT.hasPlace}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => togglePlace(true)}
              className={`flex-1 p-4 rounded-[var(--radius-md)] border-2 text-center transition-all duration-200 ${
                data.hasPlace
                  ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)]'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-light)]'
              }`}
            >
              <span className={`text-label-md ${data.hasPlace ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
                {destT.yesAddress}
              </span>
            </button>
            <button
              type="button"
              onClick={() => togglePlace(false)}
              className={`flex-1 p-4 rounded-[var(--radius-md)] border-2 text-center transition-all duration-200 ${
                !data.hasPlace
                  ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)]'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-light)]'
              }`}
            >
              <span className={`text-label-md ${!data.hasPlace ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
                {destT.needSuggestions}
              </span>
            </button>
          </div>
        </div>

        {data.hasPlace && (
          <div className="flex flex-col gap-3">
            <label htmlFor="address" className="text-label-md text-[var(--text-primary)]">
              {destT.addressLabel}
            </label>
            <div className="relative">
              <input
                id="address"
                type="text"
                placeholder={destT.addressPlaceholder}
                value={data.address}
                onChange={(e) => onChange({ ...data, address: e.target.value })}
                className="w-full px-4 py-3.5 pl-11 rounded-[var(--radius-md)] text-body-md text-white bg-[var(--bg-elevated)] placeholder:text-[var(--text-muted)] transition-all duration-200 outline-none border border-[var(--border)] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/20"
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>

            <div className="relative rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)] h-48 bg-gradient-to-br from-[rgba(212,165,116,0.08)] to-[rgba(212,165,116,0.02)]">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px)`,
              }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--accent-gold)" stroke="var(--bg-dark)" strokeWidth="1.5" className="drop-shadow-md">
                  <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z" />
                  <circle cx="12" cy="10" r="3" fill="var(--bg-dark)" />
                </svg>
                <span className="text-xs font-medium text-white bg-[var(--surface-glass)] backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
                  {destT.medellinColombia}
                </span>
              </div>
              {data.address && (
                <div className="absolute bottom-3 left-3 right-3 bg-[var(--surface-glass)] backdrop-blur-sm rounded-[var(--radius-md)] px-3 py-2 shadow-sm border border-[var(--border)]">
                  <p className="text-sm font-medium text-white truncate">{data.address}</p>
                  <p className="text-xs text-[var(--text-muted)]">{destT.medellinAntioquia}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!data.hasPlace && (
          <div className="p-5 rounded-[var(--radius-md)] bg-[rgba(212,165,116,0.06)] border border-[rgba(212,165,116,0.15)]">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <p className="text-body-md text-white font-medium mb-1">{destT.willHelp}</p>
                <p className="text-body-md text-[var(--text-secondary)]">{destT.willHelpDesc}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[var(--border)] pt-6">
          <p className="text-label-md text-[var(--text-primary)] mb-4">
            {destT.additionalTrips}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_TRIPS.map((trip) => {
              const selected = (data.additionalTrips ?? []).includes(trip.id)
              return (
                <label
                  key={trip.id}
                  className={`flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all duration-200 ${
                    selected
                      ? 'border-[var(--accent-gold)] bg-[rgba(212,165,116,0.08)]'
                      : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-light)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleTrip(trip.id)}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20 focus:ring-2 shrink-0"
                  />
                  <span className={`text-body-md ${selected ? 'text-[var(--accent-gold)] font-medium' : 'text-[var(--text-primary)]'}`}>
                    {trip.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
