'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useI18n } from '@/lib/i18n'

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
}

interface BookingConfig {
  packages: Record<string, { name: string; price: number }>
  returnTripCharge: number
  serviceFee: number
  taxRate: number
  currency: string
  advanceBookingDays: number
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
}: StepPaymentProps) {
  const { t } = useI18n()
  const paymentT = t.booking.steps.payment
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [timedOut, setTimedOut] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'paying' | 'polling' | 'done'>('loading')

  const fetchTransaction = useCallback(async () => {
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

      setTransactionId(data.transactionId)
      setLoading(false)
      setPhase('ready')
    } catch {
      setError(t.booking.steps.payment.serviceUnreachable)
      setLoading(false)
    }
  }, [bookingReference, packageId, customerEmail, customerName])

  useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  useEffect(() => {
    if (transactionId) return
    const timer = setTimeout(() => setTimedOut(true), 60000)
    return () => clearTimeout(timer)
  }, [transactionId])

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const pollPaymentStatus = useCallback(async () => {
    let attempts = 0
    const maxAttempts = 45

    pollingRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/payments/status?bookingRef=${encodeURIComponent(bookingReference)}`)
        const data = await res.json()

        if (data.status === 'completed') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setPhase('done')
          onPaymentSuccess()
          return
        }

        if (data.status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setPhase('ready')
          onPaymentError(t.common.paymentFailed)
          return
        }

        if (attempts >= maxAttempts) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setPhase('ready')
          onPaymentError(t.booking.steps.payment.paymentTimedOut || 'Payment verification timed out. Please try again.')
        }
      } catch {
        if (attempts >= maxAttempts) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setPhase('ready')
          onPaymentError(t.booking.steps.payment.paymentTimedOut || 'Payment verification timed out. Please try again.')
        }
      }
    }, 2000)
  }, [bookingReference, onPaymentSuccess, onPaymentError, t])

  const handlePay = async () => {
    if (!transactionId) return

    setPhase('paying')

    try {
      const paddleModule = await import('@paddle/paddle-js')
      const paddle = await paddleModule.initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
      })

      await paddle!.Checkout.open({
        transactionId,
        settings: {
          displayMode: 'overlay',
          successUrl: window.location.href,
        },
      })

      setPhase('polling')
      pollPaymentStatus()
    } catch (err) {
      const message = err instanceof Error ? err.message : t.common.paymentFailed
      setPhase('ready')
      onPaymentError(message)
    }
  }

  const handleError = (message: string) => {
    setError(message)
    onPaymentError(message)
  }

  const hasReturn = needReturn ?? flightData.needReturn ?? false
  const packageName = t.booking.steps.packages.packages[packageId as keyof typeof t.booking.steps.packages.packages]?.name || packageId
  const basePrice = config?.packages?.[packageId]?.price ?? 0
  const totalPrice = basePrice + (hasReturn ? (config?.returnTripCharge ?? 48) : 0)
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
              <span className="text-[var(--accent-gold)] font-medium">+${config?.returnTripCharge ?? 48}.00</span>
            </div>
          )}
          <div className="flex justify-between py-3 mt-2 border-t border-[var(--border)] text-[15px] font-semibold">
            <span className="text-white">{paymentT.summaryTotal}</span>
            <span className="text-[var(--accent-gold)]">${totalPrice}.00 USD</span>
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
              onClick={() => { setError(null); setLoading(true); setTransactionId(null); fetchTransaction() }}
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

      {timedOut && !transactionId && !error && (
        <div className="py-8 text-center">
          <p className="text-body-md text-[var(--text-secondary)] mb-2">
            {paymentT.paymentTakingLong}
          </p>
          <p className="text-body-md text-[var(--text-muted)]">
            {paymentT.paymentSaved}
          </p>
        </div>
      )}

      {phase === 'ready' && transactionId && (
        <div>
          <button
            onClick={handlePay}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-mountain-emerald to-emerald-600 text-white text-label-md font-bold hover:from-mountain-emerald/90 hover:to-emerald-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(5,150,105,0.25)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.35)]"
          >
            {t.common.payAndConfirm}
          </button>
        </div>
      )}

      {(phase === 'paying' || phase === 'polling') && (
        <div className="flex items-center gap-3 mt-4 text-[var(--text-secondary)]" aria-live="polite">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-body-md">
            {phase === 'paying' ? paymentT.preparingForm : paymentT.paymentReceived}
          </span>
        </div>
      )}
    </div>
  )
}
