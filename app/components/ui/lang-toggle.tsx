'use client'

import { useI18n } from '@/lib/i18n'

export default function LangToggle() {
  const { lang, toggleLang } = useI18n()

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-sm)] bg-[var(--glass)] border border-[var(--border)] hover:border-[var(--border-light)] transition-all duration-200"
      aria-label={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
    >
      <span className="text-sm font-medium text-cool-slate-400 uppercase tracking-wider">
        {lang}
      </span>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cool-slate-400">
        <path d="M1 1l4 4 4-4" />
      </svg>
    </button>
  )
}
