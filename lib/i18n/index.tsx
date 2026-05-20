'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import en from './locales/en'
import es from './locales/es'

type Translations = typeof en
type Lang = 'en' | 'es'

interface I18nContextValue {
  lang: Lang
  t: Translations
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

const translations: Record<Lang, Translations> = { en, es }

const STORAGE_KEY = 'localplug-lang'

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'es') return stored
  } catch {
    // localStorage unavailable — default to English
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
    } catch {
      // localStorage unavailable — state-only persistence
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'en' ? 'es' : 'en'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // localStorage unavailable — state-only persistence
      }
      return next
    })
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
