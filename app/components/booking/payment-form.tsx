'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useI18n } from '@/lib/i18n'

type ProcessingPhase = 'idle' | 'confirming' | 'polling'

interface PaymentFormProps {
  onError: (message: string) => void
  onPaymentSuccess: () => void
  bookingReference: string
}

export default function PaymentForm({ onError, onPaymentSuccess, bookingReference }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [phase, setPhase] = useState<ProcessingPhase>('idle')
  const { t } = useI18n()
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const pollPaymentStatus = useCallback(async () => {
    const maxAttempts = 30
    let attempts = 0

    pollingRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/payments/status?bookingRef=${encodeURIComponent(bookingReference)}`)
        const data = await res.json()

        if (data.status === 'completed') {
          cleanup()
          setPhase('idle')
          onPaymentSuccess()
          return
        }

        if (data.status === 'failed') {
          cleanup()
          setPhase('idle')
          onError(t.common.paymentFailed)
          return
        }

        if (attempts >= maxAttempts) {
          cleanup()
          setPhase('idle')
          onPaymentSuccess()
        }
      } catch {
        if (attempts >= maxAttempts) {
          cleanup()
          setPhase('idle')
          onPaymentSuccess()
        }
      }
    }, 2000)

    timeoutRef.current = setTimeout(() => {
      cleanup()
      setPhase('idle')
      onPaymentSuccess()
    }, 90000)
  }, [bookingReference, onPaymentSuccess, onError, cleanup, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setPhase('confirming')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    if (error) {
      onError(error.message || t.common.paymentFailed)
      setPhase('idle')
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingReference, paymentIntentId: paymentIntent.id }),
      }).catch(() => {})
      onPaymentSuccess()
      return
    }

    setPhase('polling')
    pollPaymentStatus()
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {phase === 'confirming' && (
        <div className="flex items-center gap-3 mt-4 text-cool-slate-500" aria-live="polite">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-body-md">{t.common.processingPayment}</span>
        </div>
      )}

      {phase === 'polling' && (
        <div className="flex items-center gap-3 mt-4 text-cool-slate-500" aria-live="polite">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-body-md">{t.booking.steps.payment.paymentReceived}</span>
        </div>
      )}

      {phase === 'idle' && (
        <button
          type="submit"
          disabled={!stripe || !elements}
          className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-mountain-emerald to-emerald-600 text-white text-label-md font-bold hover:from-mountain-emerald/90 hover:to-emerald-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(5,150,105,0.25)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.35)]"
        >
          {t.common.payAndConfirm}
        </button>
      )}
    </form>
  )
}
