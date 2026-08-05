'use client'

export const dynamic = 'force-dynamic'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function ConfirmationPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const reference = searchParams.get('ref') || ''

  return (
    <main className="min-h-dvh bg-bg-dark flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-bg-card rounded-2xl p-8 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-display font-bold text-white">
          {t.booking.confirmation.title}
        </h1>
        <p className="text-white/60">
          {t.booking.confirmation.subtitle}
        </p>

        {reference && (
          <div className="bg-bg-dark rounded-xl p-4 space-y-2">
            <p className="text-sm text-white/40 uppercase tracking-wider">
              {t.booking.confirmation.referenceLabel}
            </p>
            <p className="text-xl font-mono font-bold text-accent">
              {reference}
            </p>
          </div>
        )}

        <p className="text-white/60 text-sm">
          {t.booking.confirmation.whatsappInfo}
        </p>

        <div className="pt-4 space-y-3">
          <p className="text-sm font-semibold text-white/80">
            {t.booking.confirmation.nextSteps}
          </p>
          <ul className="text-sm text-white/60 text-left space-y-2">
            <li>✓ {t.booking.confirmation.stressFree}</li>
            <li>→ {t.booking.confirmation.stressFreeDesc}</li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block w-full py-3 px-6 bg-accent text-white rounded-xl
                     font-semibold hover:bg-accent/90 transition-colors"
        >
          {t.booking.confirmation.bookAnother}
        </Link>
      </div>
    </main>
  )
}
