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
  HOTEL_REVENUE_NIGHT: 'hotel_revenue_per_night',
  DRIVER_TRIP_FEE: 'driver_trip_fee_usd',
  DRIVER_TOLL: 'driver_toll_usd',
  DRIVER_PARKING_USD: 'driver_airport_parking_usd',
  DRIVER_PARKING_PCT: 'driver_airport_parking_pct',
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
  EXP_SANTA_FE: 'exp_santa_fe_price',
  PLATFORM_FEE_PCT: 'platform_fee_percent',
  PLATFORM_FEE_FIXED: 'platform_fee_fixed',
  BRAND_NAME: 'brand_name',
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
  [KEYS.HOTEL_REVENUE_NIGHT]: '85',
  [KEYS.DRIVER_TRIP_FEE]: '40',
  [KEYS.DRIVER_TOLL]: '6',
  [KEYS.DRIVER_PARKING_USD]: '20',
  [KEYS.DRIVER_PARKING_PCT]: '50',
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
  [KEYS.INACTIVITY_TIMEOUT]: '1800000',
  [KEYS.EXP_COMUNA13]: '89',
  [KEYS.EXP_GUATAPE]: '149',
  [KEYS.EXP_COFFEE]: '119',
  [KEYS.EXP_PARAGLIDING]: '79',
  [KEYS.EXP_NIGHTLIFE]: '249',
  [KEYS.EXP_VIP_CITY]: '399',
  [KEYS.EXP_SANTA_FE]: '89',
  [KEYS.PLATFORM_FEE_PCT]: '0.10',
  [KEYS.PLATFORM_FEE_FIXED]: '0.30',
  [KEYS.BRAND_NAME]: 'Medellín Premium',
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
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT price_usd FROM plans WHERE slug = ? AND is_active = 1',
      args: [packageId],
    })
    if (result.rows.length > 0) {
      return Number(result.rows[0].price_usd) || 0
    }
  } catch {
    // Fall through to settings-based lookup
  }
  const cfg = await loadConfig()
  const key = PKG_KEY_MAP[packageId]
  if (!key) return 0
  return Number(getValue(cfg, key))
}

export async function getPlanServiceFee(packageId: string): Promise<number> {
  try {
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT price_per_person_usd FROM plans WHERE slug = ? AND is_active = 1',
      args: [packageId],
    })
    if (result.rows.length > 0) {
      return Number(result.rows[0].price_per_person_usd) || 0
    }
  } catch {
    // Fall through to 0 if plans table is unavailable
  }
  return 0
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

export async function getPackageTotal(
  packageId: string,
  needReturn: boolean,
  tourIds: string[] = [],
  numPeople = 1,
): Promise<number> {
  const people = Math.max(1, Math.floor(numPeople || 1))
  const price = await getPackagePrice(packageId)
  const serviceFee = await getPlanServiceFee(packageId)
  const returnCharge = needReturn ? await getReturnTripCharge() : 0
  return price + serviceFee * people + returnCharge + (await getToursTotal(tourIds, people))
}

export async function getPackageTotalCents(packageId: string, needReturn: boolean): Promise<number> {
  return (await getPackageTotal(packageId, needReturn)) * 100
}

export async function getToursTotal(tourIds: string[], numPeople: number): Promise<number> {
  const people = Math.max(1, Math.floor(numPeople || 1))
  let total = 0
  for (const tourId of tourIds) {
    total += (await getExperiencePrice(tourId)) * people
  }
  return total
}

export async function getPackageGrandTotal(
  packageId: string,
  needReturn: boolean,
  tourIds: string[] = [],
  numPeople = 1,
): Promise<number> {
  const subtotal = await getPackageTotal(packageId, needReturn, tourIds, numPeople)
  const serviceFee = await getServiceFee()
  const taxRate = await getTaxRate()
  const iva = (subtotal - serviceFee) * taxRate
  return subtotal + serviceFee + iva
}

export async function getPackageGrandTotalCents(
  packageId: string,
  needReturn: boolean,
  tourIds: string[] = [],
  numPeople = 1,
): Promise<number> {
  return Math.round((await getPackageGrandTotal(packageId, needReturn, tourIds, numPeople)) * 100)
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

export async function getDriverTripFeeUsd(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.DRIVER_TRIP_FEE))
}

export async function getDriverTollUsd(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.DRIVER_TOLL))
}

export async function getDriverParkingUsd(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.DRIVER_PARKING_USD))
}

export async function getDriverParkingPct(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.DRIVER_PARKING_PCT))
}

export async function getDriverBaseTripCompensation(): Promise<number> {
  const [fee, toll] = await Promise.all([getDriverTripFeeUsd(), getDriverTollUsd()])
  return Math.round((fee + toll) * 100) / 100
}

export async function getDriverParkingReimbursement(): Promise<number> {
  const [parkingUsd, parkingPct] = await Promise.all([getDriverParkingUsd(), getDriverParkingPct()])
  return Math.round((parkingUsd * (parkingPct / 100)) * 100) / 100
}

export async function getDriverTripCompensation(airportParking?: boolean): Promise<number> {
  const base = await getDriverBaseTripCompensation()
  if (!airportParking) return base
  const reinf = await getDriverParkingReimbursement()
  return Math.round((base + reinf) * 100) / 100
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
    'santa-fe': KEYS.EXP_SANTA_FE,
  }
  const key = keyMap[expId]
  if (!key) return 0
  return Number(getValue(cfg, key))
}

export async function getTrips() {
  const db = getDb()
  const result = await db.execute({
    sql: 'SELECT id, name, slug, description, price_per_person_usd FROM trips WHERE is_active = 1 ORDER BY sort_order ASC',
    args: [],
  })
  return result.rows || []
}

export async function getPlatformFeePercent(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.PLATFORM_FEE_PCT))
}

export async function getPlatformFeeFixed(): Promise<number> {
  const cfg = await loadConfig()
  return Number(getValue(cfg, KEYS.PLATFORM_FEE_FIXED))
}

export async function getAllPublicConfig() {
  const cfg = await loadConfig()

  // Load plans from DB
  let plans: Record<string, {
    name: string
    price: number
    price_per_person_usd: number
    features: string[]
    tours: Array<{ id: number; name: string; description: string; price_per_person_usd: number }>
    is_popular: boolean
  }> = {}
  try {
    const db = getDb()
    const plansResult = await db.execute('SELECT id, name, slug, price_usd, price_per_person_usd, is_popular FROM plans WHERE is_active = 1 ORDER BY sort_order ASC')
    const featuresResult = await db.execute('SELECT plan_id, text FROM plan_features ORDER BY sort_order ASC')
    const toursResult = await db.execute('SELECT id, plan_id, name, description, price_per_person_usd FROM plan_tours WHERE is_active = 1 ORDER BY sort_order ASC')

    const featuresByPlan: Record<number, string[]> = {}
    for (const row of featuresResult.rows) {
      const pid = row.plan_id as number
      if (!featuresByPlan[pid]) featuresByPlan[pid] = []
      featuresByPlan[pid].push(row.text as string)
    }

    const toursByPlan: Record<number, Array<{ id: number; name: string; description: string; price_per_person_usd: number }>> = {}
    for (const row of toursResult.rows) {
      const pid = row.plan_id as number
      if (!toursByPlan[pid]) toursByPlan[pid] = []
      toursByPlan[pid].push({
        id: row.id as number,
        name: row.name as string,
        description: (row.description as string) || '',
        price_per_person_usd: Number(row.price_per_person_usd) || 0,
      })
    }

    for (const row of plansResult.rows) {
      plans[row.slug as string] = {
        name: row.name as string,
        price: Number(row.price_usd),
        price_per_person_usd: Number(row.price_per_person_usd) || 0,
        features: featuresByPlan[row.id as number] || [],
        tours: toursByPlan[row.id as number] || [],
        is_popular: Boolean(row.is_popular),
      }
    }
  } catch {
    // Fallback to settings if DB fails
    plans = {
      'smooth-landing': { name: 'The Welcome Pack', price: Number(getValue(cfg, KEYS.PKG_SMOOTH_LANDING)), price_per_person_usd: 0, features: [], tours: [], is_popular: false },
      'first-24': { name: 'The 24h Insider', price: Number(getValue(cfg, KEYS.PKG_FIRST_24)), price_per_person_usd: 30, features: [], tours: [], is_popular: true },
      'full-insider': { name: 'The Medellin Freedom Pass', price: Number(getValue(cfg, KEYS.PKG_FULL_INSIDER)), price_per_person_usd: 40, features: [], tours: [], is_popular: false },
    }
  }

  return {
    platformFeePercent: Number(getValue(cfg, KEYS.PLATFORM_FEE_PCT)),
    platformFeeFixed: Number(getValue(cfg, KEYS.PLATFORM_FEE_FIXED)),
    packages: plans,
    returnTripCharge: Number(getValue(cfg, KEYS.RETURN_TRIP_CHARGE)),
    serviceFee: Number(getValue(cfg, KEYS.SERVICE_FEE_FLAT)),
    taxRate: Number(getValue(cfg, KEYS.TAX_RATE_IVA)),
    currency: getValue(cfg, KEYS.CURRENCY),
    advanceBookingDays: Number(getValue(cfg, KEYS.ADVANCE_BOOKING_DAYS)),
    brandName: getValue(cfg, KEYS.BRAND_NAME),
    paymentPollInterval: Number(getValue(cfg, KEYS.PAYMENT_POLL_INTERVAL)),
    paymentMaxAttempts: Number(getValue(cfg, KEYS.PAYMENT_POLL_MAX)),
    paymentTimeout: Number(getValue(cfg, KEYS.PAYMENT_TIMEOUT)),
    experiences: {
      comuna13: Number(getValue(cfg, KEYS.EXP_COMUNA13)),
      guatape: Number(getValue(cfg, KEYS.EXP_GUATAPE)),
      coffee: Number(getValue(cfg, KEYS.EXP_COFFEE)),
      paragliding: Number(getValue(cfg, KEYS.EXP_PARAGLIDING)),
      nightlife: Number(getValue(cfg, KEYS.EXP_NIGHTLIFE)),
      'vip-city': Number(getValue(cfg, KEYS.EXP_VIP_CITY)),
      'santa-fe': Number(getValue(cfg, KEYS.EXP_SANTA_FE)),
    },
    trips: (await getTrips()).map((t: any) => ({
      id: t.slug,
      name: t.name,
      price_per_person_usd: Number(t.price_per_person_usd),
    })),
    trm: Number(getValue(cfg, KEYS.TRM_FALLBACK)),
  }
}

export async function refreshConfig(): Promise<void> {
  _cache = null
  await loadConfig()
}

// ── Plan helpers ──
export async function getPlanById(id: number) {
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM plans WHERE id = ? AND is_active = 1', args: [id] })
  return result.rows?.[0] || null
}

export async function getPlanBySlug(slug: string) {
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM plans WHERE slug = ? AND is_active = 1', args: [slug] })
  return result.rows?.[0] || null
}

export async function getPlanTours(planId: number) {
  const db = getDb()
  const result = await db.execute({ sql: 'SELECT * FROM plan_tours WHERE plan_id = ? AND is_active = 1', args: [planId] })
  return result.rows || []
}

export async function calculatePlanTotal(planId: number, tourIds: number[], numPeople: number) {
  const plan = await getPlanById(planId)
  if (!plan) throw new Error('Plan not found')

  const people = Math.max(1, Math.floor(numPeople || 1))
  const serviceFeePerPerson = Number(plan.price_per_person_usd) || 0
  let total = Number(plan.price_usd) + serviceFeePerPerson * people

  if (tourIds.length > 0 && people > 0) {
    const tours = await getPlanTours(planId)
    const selectedTours = tours.filter((t: any) => tourIds.includes(t.id))
    for (const tour of selectedTours) {
      total += Number(tour.price_per_person_usd) * people
    }
  }

  return { total, plan, breakdown: { planPrice: plan.price_usd, serviceFeePerPerson, tourIds, numPeople: people } }
}