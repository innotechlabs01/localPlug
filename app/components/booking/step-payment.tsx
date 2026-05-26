'use client'

import { useState, useEffect, useCallback } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/app/components/booking/lib/stripe-client'
import { useI18n } from '@/lib/i18n'
import PaymentForm from './payment-form'

const stripePromise = getStripe()

const PACKAGE_PRICES_USD: Record<string, number> = {
  'smooth-landing': 89,
  'first-24': 159,
  'full-insider': 269,
}

const RETURN_TRIP_CHARGE = 48

interface FlightData {
  flightNumber: string
  airline: string
  arrivalDate: string
  arrivalTime: string
  needReturn?: boolean
}

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
}: StepPaymentProps) {
  const { t } = useI18n()
  const paymentT = t.booking.steps.payment
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [timedOut, setTimedOut] = useState(false)

  const fetchClientSecret = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingReference,
          packageId,
          customerEmail,
          customerName,
          customerPhone,
          flightNumber: flightData.flightNumber,
          airline: flightData.airline,
          arrivalDate: flightData.arrivalDate,
          arrivalTime: flightData.arrivalTime,
          needReturn: needReturn ?? flightData.needReturn ?? false,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError(t.booking.steps.payment.alreadyInProgress)
        } else {
          setError(data.message || t.booking.steps.payment.couldNotInitiate)
        }
        setLoading(false)
        return
      }

      setClientSecret(data.clientSecret)
      setLoading(false)
    } catch {
      setError(t.booking.steps.payment.serviceUnreachable)
      setLoading(false)
    }
  }, [bookingReference, packageId, customerEmail, customerName])

  useEffect(() => {
    fetchClientSecret()
  }, [fetchClientSecret])

  useEffect(() => {
    if (clientSecret) return
    const timer = setTimeout(() => setTimedOut(true), 60000)
    return () => clearTimeout(timer)
  }, [clientSecret])

  const handleError = (message: string) => {
    setError(message)
    onPaymentError(message)
  }

  const hasReturn = needReturn ?? flightData.needReturn ?? false
  const packageName = t.booking.steps.packages.packages[packageId as keyof typeof t.booking.steps.packages.packages]?.name || packageId
  const basePrice = PACKAGE_PRICES_USD[packageId] || 0
  const totalPrice = basePrice + (hasReturn ? RETURN_TRIP_CHARGE : 0)
  const packageT = t.booking.steps.packages.packages[packageId as keyof typeof t.booking.steps.packages.packages]

  return (
    <div>
      <h2 className="text-display-lg text-white mb-2 font-display">{paymentT.title}</h2>
      <p className="text-body-md text-[var(--text-secondary)] mb-6">
        {paymentT.subtitle}
      </p>

      <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-lg)] p-6 mb-8 border border-[var(--border)]">
        <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {paymentT.summaryTitle}
        </h4>

        <div className="space-y-0">
          {packageT?.subtitle && (
            <div className="flex justify-between py-3 border-b border-[var(--border)] text-sm">
              <span className="text-[var(--text-secondary)]">{paymentT.summaryExperience}</span>
              <span className="text-white font-medium">{packageName}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-secondary)]">{paymentT.summaryArrival}</span>
            <span className="text-white font-medium">{flightData.arrivalDate || '-'}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-secondary)]">{paymentT.summaryFlight}</span>
            <span className="text-white font-medium">{flightData.flightNumber || '-'}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-secondary)]">{paymentT.summaryDestination}</span>
            <span className="text-white font-medium">{destinationAddress || paymentT.summaryToBeConfirmed}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-secondary)]">{paymentT.summaryPlan}</span>
            <span className="text-white font-medium">{packageName}</span>
          </div>
          {hasReturn && (
            <div className="flex justify-between py-3 border-b border-[var(--border)] text-sm">
              <span className="text-[var(--text-secondary)]">{paymentT.summaryReturnTrip}</span>
              <span className="text-white font-medium">${RETURN_TRIP_CHARGE} USD</span>
            </div>
          )}
          <div className="flex justify-between py-3 text-base font-bold">
            <span className="text-[var(--text-secondary)]">{paymentT.summaryTotal}</span>
            <span className="text-[var(--accent-gold)]">${totalPrice} USD</span>
          </div>
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
              onClick={() => { setError(null); setLoading(true); setClientSecret(null); fetchClientSecret() }}
              className="text-body-md text-[var(--accent-gold)] underline mt-1 hover:text-[var(--accent-gold-light)]"
            >
              {paymentT.tryAgain}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 text-[var(--text-secondary)]">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-body-md">{paymentT.preparingForm}</span>
        </div>
      )}

      {timedOut && !clientSecret && !error && (
        <div className="py-8 text-center">
          <p className="text-body-md text-[var(--text-secondary)] mb-2">
            {paymentT.paymentTakingLong}
          </p>
          <p className="text-body-md text-[var(--text-muted)]">
            {paymentT.paymentSaved}
          </p>
        </div>
      )}

      {clientSecret && (
        <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            onError={handleError}
            onPaymentSuccess={onPaymentSuccess}
            bookingReference={bookingReference}
          />
        </Elements>
      )}
    </div>
  )
}
