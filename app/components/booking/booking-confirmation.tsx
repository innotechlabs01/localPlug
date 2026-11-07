'use client'

import Button from '@/app/components/ui/button'
import { useI18n } from '@/lib/i18n'

interface BookingConfirmationProps {
  onReset: () => void
  bookingReference: string
}

export default function BookingConfirmation({ onReset, bookingReference }: BookingConfirmationProps) {
  const { t } = useI18n()
  const confirmT = t.booking.confirmation

  return (
    <div className="text-center py-12 max-w-md mx-auto">
      <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-[var(--success)] to-[#059669] flex items-center justify-center mx-auto mb-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--bg-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      </div>
      <h2 className="text-display-lg text-white mb-3 font-display">
        {confirmT.title}
      </h2>
      <p className="text-body-lg text-[var(--text-secondary)] mb-6">
        {confirmT.subtitle}
      </p>

      {bookingReference && (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] p-4 mb-6">
          <p className="text-sm text-[var(--text-muted)] mb-1">{confirmT.referenceLabel}</p>
          <p className="text-lg text-[var(--accent-gold)] font-mono tracking-wider">{bookingReference.slice(0, 8).toUpperCase()}</p>
        </div>
      )}

      <div className="bg-[rgba(212,165,116,0.1)] border border-[rgba(212,165,116,0.2)] rounded-[var(--radius-md)] p-4 mb-8 text-left">
        <p className="text-body-md text-[var(--accent-gold-light)]">
          <strong>{confirmT.nextSteps}</strong> {confirmT.whatsappInfo}
        </p>
      </div>
      <Button variant="primary" onClick={onReset}>
        {confirmT.bookAnother}
      </Button>
    </div>
  )
}
