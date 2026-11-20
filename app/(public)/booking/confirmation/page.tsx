'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function ConfirmationPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const reference = searchParams.get('ref') || ''
  const customerName = searchParams.get('customer') || ''

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

        {customerName && (
          <div className="bg-[rgba(212,165,116,0.1)] rounded-xl p-4 border border-[rgba(212,165,116,0.2)]">
            <p className="text-sm font-semibold text-[var(--accent-gold)] mb-1">
              Hola, {customerName}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Tu reserva ha sido creada correctamente. Te enviaremos un mensaje por WhatsApp con los detalles de confirmación y los datos del conductor.
            </p>
          </div>
        )}

        <div className="pt-4 space-y-3">
          <p className="text-sm font-semibold text-white/80">
            {t.booking.confirmation.nextSteps}
          </p>
          <ul className="text-sm text-[var(--text-muted)] text-left space-y-2">
            <li>✓ {t.booking.confirmation.stressFree}</li>
            <li>→ {t.booking.confirmation.stressFreeDesc}</li>
            <li>📱 Recibirás un WhatsApp con los detalles del conductor y la hora de recogida</li>
            <li>📧 También recibirás un email con el comprobante de reserva</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex-col md:flex-row items-center justify-center py-3 px-6 bg-accent text-white rounded-xl font-semibold hover:bg-[var(--accent-gold-light)] transition-colors"
          >
            {t.booking.confirmation.bookAnother}
          </Link>
          <Link
            href="/driver/page"
            className="flex-1 flex-col sm:flex-row items-center justify-center py-3 px-6 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl border border-[var(--border)] font-semibold hover:bg-[var(--bg-elevated)/50] transition-colors"
          >
            Ver mis reservas
          </Link>
        </div>

        <p className="text-white/40 text-xs">
          {t.booking.confirmation.feedbackPrompt}{' '}
          <Link href="/feedback" className="text-accent hover:text-accent-light underline underline-offset-2 transition-colors">
            {t.booking.confirmation.feedbackLink}
          </Link>
        </p>
      </div>
    </main>
  )
}
