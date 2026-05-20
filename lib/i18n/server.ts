import en from './locales/en'
import es from './locales/es'

const locales = { en, es } as const

function getNestedValue(obj: Record<string, unknown>, path: string[]): string | undefined {
  let current: unknown = obj
  for (const key of path) {
    if (current === null || typeof current !== 'object') return
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

export function t(locale: string, key: string, params?: Record<string, string>): string {
  const keys = key.split('.')
  const localeObj = locales[locale as keyof typeof locales] || locales.en

  let value = getNestedValue(localeObj as unknown as Record<string, unknown>, keys)
  if (!value && locale !== 'en') {
    value = getNestedValue(locales.en as unknown as Record<string, unknown>, keys)
  }

  if (!value) return key

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, v)
    }
  }

  return value
}
