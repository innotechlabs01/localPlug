'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import en from './locales/en'
import es from './locales/es'

type Translations = typeof en
export type Lang = 'en' | 'es'

interface I18nContextValue {
  lang: Lang
  t: Translations
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

const translations: Record<Lang, Translations> = { en, es }

const STORAGE_KEY = 'localplug-lang'

function setLangCookie(value: Lang) {
  try {
    document.cookie = `${STORAGE_KEY}=${value};path=/;max-age=31536000;SameSite=Lax`
  } catch {
    // cookie unavailable
  }
}

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang || 'en')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'es') {
        if (stored !== lang) {
          setLangState(stored)
          setLangCookie(stored)
        }
        return
      }
    } catch {
      // localStorage unavailable
    }
    localStorage.setItem(STORAGE_KEY, lang)
    setLangCookie(lang)
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
      setLangCookie(newLang)
    } catch {
      // localStorage unavailable — state-only persistence
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'en' ? 'es' : 'en'
      try {
        localStorage.setItem(STORAGE_KEY, next)
        setLangCookie(next)
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
