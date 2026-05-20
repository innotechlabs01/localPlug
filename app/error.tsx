'use client'

import en from '@/lib/i18n/locales/en'
import es from '@/lib/i18n/locales/es'

function getTranslations() {
  if (typeof window === 'undefined') return en
  try {
    const lang = localStorage.getItem('localplug-lang')
    return lang === 'es' ? es : en
  } catch {
    return en
  }
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = getTranslations()

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark px-4">
      <div className="text-center max-w-md">
        <h1 className="text-display-lg text-white mb-4 font-display">
          {t.errors.title}
        </h1>
        <p className="text-body-lg text-[var(--text-secondary)] mb-8">
          {t.errors.message}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-md)] bg-gold-gradient text-[var(--bg-dark)] font-semibold hover:opacity-90 transition-all shadow-gold"
        >
          {t.errors.tryAgain}
        </button>
      </div>
    </div>
  )
}
