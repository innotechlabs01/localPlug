// Global platform constants (non-business, runtime-boundary safe).
// These are NOT DB-backed settings — they are true compile-time/runtime constants.

export const APP_NAME = 'LocalPlug'

export const SUPPORTED_LOCALES = ['en', 'es'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const DEFAULT_TIMEZONE = 'America/Bogota'

export const SUPPORTED_CURRENCIES = ['USD', 'COP', 'EUR'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]