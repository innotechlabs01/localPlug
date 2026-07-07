'use client'

import { useI18n } from '@/lib/i18n'

interface BookingConfig {
  packages: Record<string, { name: string; price: number }>
  returnTripCharge: number
  serviceFee: number
  taxRate: number
  currency: string
  advanceBookingDays: number
}

interface BookingSummaryProps {
  packageId: string
  needReturn: boolean
  currentStep: number
  totalSteps: number
  onConfirm: () => void
  isSubmitting: boolean
  config?: BookingConfig | null
}

export function BookingSummarySidebar({
  packageId,
  needReturn,
  config,
}: {
  packageId: string
  needReturn: boolean
  config?: BookingConfig | null
}) {
  const { t } = useI18n()
  const basePrice = config?.packages?.[packageId]?.price ?? 0
  const returnCharge = needReturn ? (config?.returnTripCharge ?? 48) : 0
  const subtotal = basePrice + returnCharge
  const serviceFee = config?.serviceFee ?? 5
  const taxRate = config?.taxRate ?? 0.19
  const iva = (subtotal - serviceFee) * taxRate
  const total = subtotal + serviceFee + iva
  const packageName = t.booking.steps.packages.packages?.[packageId as keyof typeof t.booking.steps.packages.packages]?.name || packageId

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">
          {t.booking.steps.payment.summaryTitle || 'Booking Summary'}
        </h3>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Live
        </span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-1">
        {packageId ? (
          <>
            <div className="flex justify-between items-start py-1.5 text-[13px]">
              <span className="text-[var(--text-secondary)]">{packageName}</span>
              <span className="font-medium text-white text-right min-w-[80px]">${basePrice.toFixed(2)}</span>
            </div>

            {needReturn && (
              <div className="flex justify-between items-start py-1.5 text-[13px]">
                <span className="text-[var(--text-secondary)]">
                  {t.booking.steps.payment.summaryReturnTrip || 'Return Transport'}
                </span>
                <span className="font-medium text-[var(--accent-gold)] text-right min-w-[80px]">+${returnCharge.toFixed(2)}</span>
              </div>
            )}

            <div className="h-px bg-[var(--border)] my-2" />

            <div className="flex justify-between items-start py-1.5 text-[13px]">
              <span className="text-[var(--text-secondary)]">Service Fee</span>
              <span className="font-medium text-white text-right min-w-[80px]">${serviceFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-start py-1.5 text-[13px]">
              <span className="text-[var(--text-secondary)]">IVA (19%)</span>
              <span className="font-medium text-white text-right min-w-[80px]">
                ${iva.toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-[13px] text-[var(--text-muted)] leading-relaxed">
            <div className="text-[32px] mb-3 opacity-40">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            Select a package to see your booking summary
          </div>
        )}
      </div>

      {packageId && (
        <>
          <div className="flex justify-between items-center px-5 py-4 border-t border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
            <span className="text-[14px] font-semibold text-white">Total</span>
            <span className="text-[24px] font-bold tracking-tight text-[var(--accent-gold)] transition-all duration-350">
              ${total.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 px-5 pb-4 pt-1 text-[11px] text-[var(--text-muted)]">
            <span>Free cancellation 24h</span>
            <span>·</span>
            <span>Secure payment</span>
          </div>
        </>
      )}
    </div>
  )
}

export function MobileStickyBar({
  packageId,
  needReturn,
  currentStep,
  totalSteps,
  onConfirm,
  isSubmitting,
  config,
}: BookingSummaryProps) {
  const { t } = useI18n()
  const subtotal = packageId ? ((config?.packages?.[packageId]?.price ?? 0) + (needReturn ? (config?.returnTripCharge ?? 48) : 0)) : 0
  const serviceFee = config?.serviceFee ?? 5
  const taxRate = config?.taxRate ?? 0.19
  const iva = (subtotal - serviceFee) * taxRate
  const total = packageId ? (subtotal + serviceFee + iva) : 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border)] px-5 py-3 pb-[max(16px,env(safe-area-inset-bottom))] backdrop-blur-[16px]">
      {isLastStep ? (
        <button
          onClick={onConfirm}
          disabled={!packageId || isSubmitting}
          className="w-full py-3.5 rounded-[var(--radius-sm)] bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-light)] text-[var(--bg-dark)] font-bold text-[15px] flex items-center justify-center gap-2 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(212,165,116,0.25)] active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {t.booking.steps.payment.title || 'Confirm & Pay'}
        </button>
      ) : packageId ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">Total</div>
            <div className="text-[20px] font-bold text-[var(--accent-gold)] leading-none">${total.toFixed(2)}</div>
          </div>
        </div>
      ) : (
        <div className="text-center text-[13px] text-[var(--text-muted)]">
          Select a package to continue
        </div>
      )}
    </div>
  )
}
