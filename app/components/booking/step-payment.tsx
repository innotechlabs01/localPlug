'use client'

import { useState, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { computeBookingTotals } from './lib/booking-totals'
import { CONFIG_DEFAULTS } from './lib/config-defaults'
import type { DestinationData } from './lib/types'

interface StepPaymentProps {
  bookingReference: string
  packageId: string
  customerEmail: string
  customerName: string
  customerPhone: string
  flightData: FlightData
  destinationAddress: string
  needReturn?: boolean
  onPaymentSuccess: () => void
  onPaymentError: (message: string) => void
  config?: BookingConfig | null
  destination?: DestinationData | null
}

interface BookingConfig {
  packages: Record<string, { name: string; price: number; price_per_person_usd?: number; features?: string[]; tours?: Array<{ id: number; name: string; description: string; price_per_person_usd: number }>; is_popular?: boolean }>
  returnTripCharge: number
  serviceFee: number
  taxRate: number
  currency: string
  advanceBookingDays: number
  trips?: Array<{ id: string; name: string; price_per_person_usd: number }>
  trm?: number
  experiences?: Record<string, number>
}

interface FlightData {
  flightNumber: string
  airline: string
  arrivalDate: string
  arrivalTime: string
  needReturn?: boolean
}

export default function StepPayment({
  bookingReference,
  packageId,
  customerEmail,
  customerName,
  customerPhone,
  flightData,
  destinationAddress,
  needReturn,
  onPaymentSuccess,
  onPaymentError,
  config,
  destination,
}: StepPaymentProps) {
  const { t } = useI18n()
  const paymentT = t.booking.steps.payment
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'ready' | 'redirecting'>('ready')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handlePay = useCallback(async () => {
    setPhase('redirecting')
    setError(null)

    try {
      const res = await fetch('/api/checkout/polar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingReference,
          packageId,
          customerEmail,
          customerName,
          customerPhone,
          needReturn: needReturn ?? flightData.needReturn ?? false,
          tour_ids: destination?.additionalTrips ?? [],
          num_people: Math.max(1, Math.floor(destination?.numPeople || 1)),
          flightNumber: flightData.flightNumber,
          airline: flightData.airline,
          arrivalDate: flightData.arrivalDate,
          arrivalTime: flightData.arrivalTime,
          destinationAddress,
          returnDate: (destination as unknown as Record<string, string>)?.returnDate || '',
          returnTime: (destination as unknown as Record<string, string>)?.returnTime || '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError(t.booking.steps.payment.alreadyInProgress)
        } else {
          setError(data.message || t.booking.steps.payment.couldNotInitiate)
        }
        setPhase('ready')
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setError('No checkout URL received')
        setPhase('ready')
      }
    } catch {
      setError(t.booking.steps.payment.serviceUnreachable)
      setPhase('ready')
    }
  }, [bookingReference, packageId, customerEmail, customerName, customerPhone, needReturn, flightData, destination, t])

  const hasReturn = needReturn ?? flightData.needReturn ?? false
  const packageName = t.booking.steps.packages.packages[packageId as keyof typeof t.booking.steps.packages.packages]?.name || packageId
  const basePrice = config?.packages?.[packageId]?.price ?? 0
  const servicePrice = config?.packages?.[packageId]?.price_per_person_usd ?? 0
  const returnCharge = hasReturn ? (config?.returnTripCharge ?? CONFIG_DEFAULTS.returnTripCharge) : 0
  const serviceFee = config?.serviceFee ?? CONFIG_DEFAULTS.serviceFee
  const taxRate = config?.taxRate ?? CONFIG_DEFAULTS.taxRate
  const tripPrices = config?.experiences ?? {}
  const selectedTrips = destination?.additionalTrips ?? []
  const numPeople = Math.max(1, Math.floor(destination?.numPeople || 1))
  const tourPrices = selectedTrips.map((id) => tripPrices[id] ?? 0)
  const totals = computeBookingTotals({ basePrice, returnCharge, tourPrices, numPeople, serviceFee, taxRate })
  const totalPrice = totals.total
  const tripLabels = t.booking.steps.destination.trips
  const packageT = t.booking.steps.packages.packages[packageId as keyof typeof t.booking.steps.packages.packages]

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{paymentT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-6">
        {paymentT.subtitle}
      </p>

      <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] p-5 mb-8 border border-[var(--border)]">
        <h4 className="text-[14px] font-semibold text-white mb-4 pb-3 border-b border-[var(--border)] flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {paymentT.summaryTitle}
        </h4>

        <div className="space-y-0">
          {packageT?.name && (
            <div className="flex justify-between py-2.5 text-[13px]">
              <span className="text-[var(--text-secondary)]">{paymentT.summaryExperience}</span>
              <span className="text-white font-medium">{packageT.name}</span>
            </div>
          )}
          {totals.serviceTotal > 0 && (
            <div className="flex justify-between py-2.5 text-[13px]">
              <span className="text-[var(--text-secondary)]">{paymentT.summaryService} <span className="text-[var(--text-muted)]">({numPeople} {paymentT.summaryPeople})</span></span>
              <span className="text-white font-medium">+{totals.serviceTotal.toFixed(2)} USD</span>
            </div>
          )}
          <div className="flex justify-between py-2.5 text-[13px]">
            <span className="text-[var(--text-secondary)]">{paymentT.summaryArrival || 'Arrival'}</span>
            <span className="text-white font-medium">{flightData.arrivalDate || '-'}</span>
          </div>
          <div className="flex justify-between py-2.5 text-[13px]">
            <span className="text-[var(--text-secondary)]">{paymentT.summaryFlight || 'Flight'}</span>
            <span className="text-white font-medium">{flightData.flightNumber || '-'}</span>
          </div>
          <div className="flex justify-between py-2.5 text-[13px]">
            <span className="text-[var(--text-secondary)]">{paymentT.summaryDestination || 'Destination'}</span>
            <span className="text-white font-medium max-w-[200px] truncate text-right">{destinationAddress || paymentT.summaryToBeConfirmed || 'To be confirmed'}</span>
          </div>
          {hasReturn && (
            <div className="flex justify-between py-2.5 text-[13px]">
              <span className="text-[var(--text-secondary)]">{paymentT.summaryReturnTrip || 'Return Transport'}</span>
              <span className="text-[var(--accent-gold)] font-medium">+${config?.returnTripCharge ?? CONFIG_DEFAULTS.returnTripCharge}.00</span>
            </div>
          )}
          {selectedTrips.length > 0 && (
            <div className="flex justify-between py-2.5 text-[13px]">
              <span className="text-[var(--text-secondary)]">{paymentT.summaryExperiences}</span>
              <span className="text-white font-medium">{numPeople} {paymentT.summaryPeople}</span>
            </div>
          )}
          {selectedTrips.map((id) => {
            const label = tripLabels?.[id as keyof typeof tripLabels] || id
            const unit = tripPrices[id] ?? 0
            return (
              <div key={id} className="flex justify-between py-1.5 text-[12px]">
                <span className="text-[var(--text-secondary)]">
                  {label} <span className="text-[var(--text-muted)]">(${unit.toFixed(2)} × {numPeople})</span>
                </span>
                <span className="text-white font-medium">${(unit * numPeople).toFixed(2)}</span>
              </div>
            )
          })}
          {totals.toursTotal > 0 && (
            <div className="flex justify-between py-2.5 text-[13px]">
              <span className="text-[var(--text-secondary)]">{paymentT.summaryExperiences} total</span>
              <span className="text-[var(--accent-gold)] font-medium">+${totals.toursTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 mt-2 border-t border-[var(--border)] text-[15px] font-semibold">
            <span className="text-white">{paymentT.summaryTotal}</span>
            <span className="text-[var(--accent-gold)]">${Number(totalPrice).toFixed(2)} USD</span>
          </div>

          {config?.trm && (
            <div className="mt-2 text-[11px] text-[var(--text-muted)] text-right">
              TRM: {Number(config.trm).toLocaleString('es-CO')} COP/USD · Total: ${(totalPrice * Number(config.trm)).toLocaleString('es-CO')} COP
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] flex items-start gap-3" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-body-md text-[#f87171] font-medium">{error}</p>
            <button
              type="button"
              onClick={() => { setError(null); setPhase('ready') }}
              className="text-body-md text-[var(--accent-gold)] underline mt-1 hover:text-[var(--accent-gold-light)]"
            >
              {paymentT.tryAgain}
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-card)] text-[var(--accent-gold)] focus:ring-[var(--accent-gold)] focus:ring-offset-0"
          />
          <span className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {paymentT.acceptTerms}{' '}
            <a href="/terms" target="_blank" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-light)]">{paymentT.termsLink}</a>,{' '}
            <a href="/privacy" target="_blank" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-light)]">{paymentT.privacyLink}</a>{' '}
            {paymentT.and}{' '}
            <a href="/refund-policy" target="_blank" className="text-[var(--accent-gold)] underline hover:text-[var(--accent-gold-light)]">{paymentT.refundLink}</a>
          </span>
        </label>
        {!termsAccepted && (
          <p className="text-[12px] text-[var(--text-muted)] mt-2 ml-7">{paymentT.mustAccept}</p>
        )}
      </div>

      {phase === 'ready' && (
        <div>
          <button
            onClick={handlePay}
            disabled={!termsAccepted}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-light)] text-[var(--bg-dark)] text-label-md font-bold hover:from-[var(--accent-gold-light)] hover:to-[var(--accent-gold)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(212,165,116,0.25)] hover:shadow-[0_6px_20px_rgba(212,165,116,0.35)]"
          >
            {t.common.payAndConfirm}
          </button>
        </div>
      )}

      {phase === 'redirecting' && (
        <div className="flex items-center gap-3 mt-4 text-[var(--text-secondary)]" aria-live="polite">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-body-md">{paymentT.preparingForm}</span>
        </div>
      )}
    </div>
  )
}
