import Link from 'next/link'
import en from '@/lib/i18n/locales/en'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark px-4">
      <div className="text-center max-w-md">
        <h1 className="text-display-xl text-[var(--accent-gold)] mb-4 font-display">404</h1>
        <h2 className="text-display-lg text-white mb-4 font-display">{en.notFound.title}</h2>
        <p className="text-body-lg text-[var(--text-secondary)] mb-8">
          {en.notFound.message}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-md)] bg-gold-gradient text-[var(--bg-dark)] font-semibold hover:opacity-90 transition-all shadow-gold"
        >
          {en.notFound.backHome}
        </Link>
      </div>
    </div>
  )
}
