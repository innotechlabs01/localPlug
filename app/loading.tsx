import en from '@/lib/i18n/locales/en'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
        <p className="text-body-md text-[var(--text-secondary)]">{en.loading.text}</p>
      </div>
    </div>
  )
}
