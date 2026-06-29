import { getDb } from '@/lib/db'

// ── Setting keys ──
const KEYS = {
  PKG_SMOOTH_LANDING: 'pkg_smooth_landing_price',
  PKG_FIRST_24: 'pkg_first_24_price',
  PKG_FULL_INSIDER: 'pkg_full_insider_price',
  RETURN_TRIP_CHARGE: 'return_trip_charge',
  SERVICE_FEE_FLAT: 'service_fee_flat',
  TAX_RATE_IVA: 'tax_rate_iva',
  HOTEL_COMMISSION: 'hotel_commission_rate',
  DRIVER_COMMISSION: 'driver_commission_rate',
  STRIPE_FEE_PCT: 'stripe_fee_percent',
  STRIPE_FEE_FIXED: 'stripe_fee_fixed',
  HOTEL_REVENUE_NIGHT: 'hotel_revenue_per_night',
  TRM_FALLBACK: 'trm_fallback_rate',
  ADVANCE_BOOKING_DAYS: 'advance_booking_days',
  RATE_LIMIT_MAX: 'rate_limit_max_requests',
  RATE_LIMIT_WINDOW: 'rate_limit_window_ms',
  PAYMENT_TIMEOUT: 'payment_intent_timeout_ms',
  PAYMENT_POLL_INTERVAL: 'payment_polling_interval_ms',
  PAYMENT_POLL_MAX: 'payment_polling_max_attempts',
  CURRENCY: 'default_currency',
  TIMEZONE: 'default_timezone',
  LANGUAGE: 'default_language',
  DATE_FORMAT: 'date_format',
  ADMIN_REFRESH: 'admin_refresh_interval_ms',
  CHAT_CONNECT_TIMEOUT: 'chat_connection_timeout_ms',
  CHAT_RECONNECT_TIMEOUT: 'chat_reconnect_timeout_ms',
  INACTIVITY_TIMEOUT: 'inactivity_timeout_ms',
  EXP_COMUNA13: 'exp_comuna13_price',
  EXP_GUATAPE: 'exp_guatape_price',
  EXP_COFFEE: 'exp_coffee_price',
  EXP_PARAGLIDING: 'exp_paragliding_price',
  EXP_NIGHTLIFE: 'exp_nightlife_price',
  EXP_VIP_CITY: 'exp_vip_city_price',
} as const

// ── Defaults (match current hardcodes exactly) ──
const DEFAULTS: Record<string, string> = {
  [KEYS.PKG_SMOOTH_LANDING]: '89',
  [KEYS.PKG_FIRST_24]: '159',
  [KEYS.PKG_FULL_INSIDER]: '269',
  [KEYS.RETURN_TRIP_CHARGE]: '48',
  [KEYS.SERVICE_FEE_FLAT]: '5',
  [KEYS.TAX_RATE_IVA]: '0.19',
  [KEYS.HOTEL_COMMISSION]: '0.10',
  [KEYS.DRIVER_COMMISSION]: '30',
  [KEYS.STRIPE_FEE_PCT]: '0.029',
  [KEYS.STRIPE_FEE_FIXED]: '0.30',
  [KEYS.HOTEL_REVENUE_NIGHT]: '85',
  [KEYS.TRM_FALLBACK]: '4200',
  [KEYS.ADVANCE_BOOKING_DAYS]: '10',
  [KEYS.RATE_LIMIT_MAX]: '20',
  [KEYS.RATE_LIMIT_WINDOW]: '60000',
  [KEYS.PAYMENT_TIMEOUT]: '60000',
  [KEYS.PAYMENT_POLL_INTERVAL]: '2000',
  [KEYS.PAYMENT_POLL_MAX]: '30',
  [KEYS.CURRENCY]: 'usd',
  [KEYS.TIMEZONE]: 'America/Bogota',
  [KEYS.LANGUAGE]: 'en',
  [KEYS.DATE_FORMAT]: 'MM/DD/YYYY',
  [KEYS.ADMIN_REFRESH]: '30000',
  [KEYS.CHAT_CONNECT_TIMEOUT]: '90000',
  [KEYS.CHAT_RECONNECT_TIMEOUT]: '60000',
  [KEYS.INACTIVITY_TIMEOUT]: '900000',
  [KEYS.EXP_COMUNA13]: '89',
  [KEYS.EXP_GUATAPE]: '149',
  [KEYS.EXP_COFFEE]: '119',
  [KEYS.EXP_PARAGLIDING]: '79',
  [KEYS.EXP_NIGHTLIFE]: '249',
  [KEYS.EXP_VIP_CITY]: '399',
}

// ── Cache ──
let _cache: Map<string, string> | null = null
let _cacheAt = 0
const CACHE_TTL = 60_000

export class ConfigLoadError extends Error {
  constructor(message: string) {
    super(`[Config] ${message}`)
    this.name = 'ConfigLoadError'
  }
}

async function loadConfig(): Promise<Map<string, string>> {
  const now = Date.now()
  if (_cache && now - _cacheAt < CACHE_TTL) return _cache

  try {
    const db = getDb()
    const result = await db.execute('SELECT key, value FROM settings')
    const map = new Map<string, string>(Object.entries(DEFAULTS))
    for (const row of result.rows) {
      const key = row.key as string | null
      const value = row.value as string | null
      if (key) {
        map.set(key, value ?? '')
      }
    }
    _cache = map
    _cacheAt = now
    return map
  } catch (err) {
    throw new ConfigLoadError(
      `Failed to load config from database: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

function getValue(map: Map<string, string>, key: string): string {
  const v = map.get(key)
  if (v === undefined || v === '' || v === null) return DEFAULTS[key] ?? ''
  return v
}

// ── Public API ──
export const PACKAGE_IDS = ['smooth-landing', 'first-24', 'full-insider'] as const
export type PackageId = (typeof PACKAGE_IDS)[number]

const PKG_KEY_MAP: Record<string, string> = {
  'smooth-landing': KEYS.PKG_SMOOTH_LANDING,
  'first-24': KEYS.PKG_FIRST_24,
  'full-insider': KEYS.PKG_FULL_INSIDER,
}

export async function getPackagePrice(packageId: string): Promise<number> {
  const cfg = await loadConfig()
  const key = PKG_KEY_MAP[packageId]
  if (!key) return 0
  return Number(getValue(cfg, key))
}

export async function getPackagePriceCents(packageId: string): Promise<number> {
  return (await getPackagePrice(packageId)) * 100
}

export async function getReturnTripCharge(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.RETURN_TRIP_CHARGE))
}

export async function getReturnTripChargeCents(): Promise<number> {
  return (await getReturnTripCharge()) * 100
}

export async function getPackageTotal(packageId: string, needReturn: boolean): Promise<number> {
  const price = await getPackagePrice(packageId)
  const returnCharge = needReturn ? await getReturnTripCharge() : 0
  return price + returnCharge
}

export async function getPackageTotalCents(packageId: string, needReturn: boolean): Promise<number> {
  return (await getPackageTotal(packageId, needReturn)) * 100
}

export async function getPackageName(packageId: string): Promise<string> {
  const cfg = await loadConfig()
  return cfg.get(`pkg_${packageId.replace(/-/g, '_')}_name`) || packageId
}

export async function getServiceFee(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.SERVICE_FEE_FLAT))
}

export async function getTaxRate(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.TAX_RATE_IVA))
}

export async function getDefaultCurrency(): Promise<string> {
  const cfg = await loadConfig()
  return getValue(cfg, KEYS.CURRENCY)
}

export async function getAdvanceBookingDays(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.ADVANCE_BOOKING_DAYS))
}

export async function getHotelCommissionRate(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.HOTEL_COMMISSION))
}

export async function getDriverCommissionRate(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.DRIVER_COMMISSION))
}

export async function getStripeFeePercent(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.STRIPE_FEE_PCT))
}

export async function getStripeFeeFixed(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.STRIPE_FEE_FIXED))
}

export async function getHotelRevenuePerNight(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.HOTEL_REVENUE_NIGHT))
}

export async function getTrmFallbackRate(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.TRM_FALLBACK))
}

export async function getRateLimitConfig(): Promise<{ maxRequests: number; windowMs: number }> {
  const cfg = await loadConfig()
  return {
    maxRequests: Number(getValue(cfg, KEYS.RATE_LIMIT_MAX)),
    windowMs: Number(getValue(cfg, KEYS.RATE_LIMIT_WINDOW)),
  }
}

export async function getPaymentTimeoutConfig(): Promise<{
  intentTimeoutMs: number
  pollingIntervalMs: number
  maxAttempts: number
}> {
  const cfg = await loadConfig()
  return {
    intentTimeoutMs: Number(getValue(cfg, KEYS.PAYMENT_TIMEOUT)),
    pollingIntervalMs: Number(getValue(cfg, KEYS.PAYMENT_POLL_INTERVAL)),
    maxAttempts: Number(getValue(cfg, KEYS.PAYMENT_POLL_MAX)),
  }
}

export async function getAdminRefreshInterval(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.ADMIN_REFRESH))
}

export async function getChatTimeouts(): Promise<{ connectionMs: number; reconnectMs: number }> {
  const cfg = await loadConfig()
  return {
    connectionMs: Number(getValue(cfg, KEYS.CHAT_CONNECT_TIMEOUT)),
    reconnectMs: Number(getValue(cfg, KEYS.CHAT_RECONNECT_TIMEOUT)),
  }
}

export async function getInactivityTimeout(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.INACTIVITY_TIMEOUT))
}

export async function getExperiencePrice(expId: string): Promise<number> {
  const cfg = await loadConfig()
  const keyMap: Record<string, string> = {
    comuna13: KEYS.EXP_COMUNA13,
    guatape: KEYS.EXP_GUATAPE,
    coffee: KEYS.EXP_COFFEE,
    paragliding: KEYS.EXP_PARAGLIDING,
    nightlife: KEYS.EXP_NIGHTLIFE,
    'vip-city': KEYS.EXP_VIP_CITY,
  }
  const key = keyMap[expId]
  if (!key) return 0
  return Number(getValue(cfg, key))
}

export async function getAllPublicConfig() {
  const cfg = await loadConfig()
  return {
    packages: {
      'smooth-landing': {
        name: 'The VIP Arrival',
        price: Number(getValue(cfg, KEYS.PKG_SMOOTH_LANDING)),
      },
      'first-24': {
        name: 'The 24h Insider',
        price: Number(getValue(cfg, KEYS.PKG_FIRST_24)),
      },
      'full-insider': {
        name: 'The Peace of Mind',
        price: Number(getValue(cfg, KEYS.PKG_FULL_INSIDER)),
      },
    },
    returnTripCharge: Number(getValue(cfg, KEYS.RETURN_TRIP_CHARGE)),
    serviceFee: Number(getValue(cfg, KEYS.SERVICE_FEE_FLAT)),
    taxRate: Number(getValue(cfg, KEYS.TAX_RATE_IVA)),
    currency: getValue(cfg, KEYS.CURRENCY),
    advanceBookingDays: Number(getValue(cfg, KEYS.ADVANCE_BOOKING_DAYS)),
    stripeFeePercent: Number(getValue(cfg, KEYS.STRIPE_FEE_PCT)),
    stripeFeeFixed: Number(getValue(cfg, KEYS.STRIPE_FEE_FIXED)),
    experiences: {
      comuna13: Number(getValue(cfg, KEYS.EXP_COMUNA13)),
      guatape: Number(getValue(cfg, KEYS.EXP_GUATAPE)),
      coffee: Number(getValue(cfg, KEYS.EXP_COFFEE)),
      paragliding: Number(getValue(cfg, KEYS.EXP_PARAGLIDING)),
      nightlife: Number(getValue(cfg, KEYS.EXP_NIGHTLIFE)),
      'vip-city': Number(getValue(cfg, KEYS.EXP_VIP_CITY)),
    },
  }
}

export async function refreshConfig(): Promise<void> {
  _cache = null
  await loadConfig()
}

const REQUIRED_ENV_VARS = [
  'TURSO_DATABASE_URL',
  'TURSO_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
]

const WARN_ENV_VARS = [
  'N8N_BASE_URL',
  'N8N_API_KEY',
  'N8N_WEBHOOK_SECRET',
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
  'EVOLUTION_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
]

let _envValidated = false

export function validateEnv(): { missing: string[]; warnings: string[] } {
  if (_envValidated) return { missing: [], warnings: [] }
  _envValidated = true

  const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k])
  const warnings = WARN_ENV_VARS.filter(k => !process.env[k])

  if (missing.length > 0) {
    console.error(`[Config] Missing required environment variables: ${missing.join(', ')}`)
  }
  if (warnings.length > 0) {
    console.warn(`[Config] Missing optional environment variables: ${warnings.join(', ')}`)
  }

  return { missing, warnings }
}
