// Shared primitive types and utilities.
// Part of @lp/types (B7). Pure TS, no external deps.

// ─── UUID ───
export type UUID = string & { readonly __brand: unique symbol }

export function isUUID(value: string): value is UUID {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function asUUID(value: string): UUID {
  if (!isUUID(value)) throw new Error(`Invalid UUID: ${value}`)
  return value as UUID
}

// ─── Enums ───
export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export type BookingType = 'airport_transfer' | 'city_transfer' | 'hourly' | 'experience'

export type ExperienceType = 'comuna13' | 'guatape' | 'coffee' | 'paragliding' | 'nightlife' | 'vip_city'

export type VehicleType = 'sedan' | 'suv' | 'van' | 'luxury' | 'electric'

export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid'

export type VehicleStatus = 'active' | 'maintenance' | 'retired' | 'unavailable'

export type DriverStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification'

export type LicenseType = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled'

export type PaymentProvider = 'paddle' | 'stripe' | 'cash' | 'transfer'

export type PaymentType = 'booking' | 'experience' | 'subscription' | 'penalty' | 'adjustment'

export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'pending_verification'

export type CustomerSource = 'organic' | 'referral' | 'advertising' | 'social' | 'partner' | 'admin'

export type NotificationChannel = 'email' | 'sms' | 'push' | 'whatsapp' | 'in_app'

export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'driver_assigned'
  | 'driver_arrived'
  | 'trip_started'
  | 'trip_completed'
  | 'payment_received'
  | 'payment_failed'
  | 'review_request'
  | 'system_alert'
  | 'promotion'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'completed'

export type AssignmentType = 'auto' | 'manual' | 'broadcast'

// ─── Currency ───
export type CurrencyCode = 'USD' | 'COP' | 'EUR'

// ─── Money ───
export interface Money {
  readonly minorUnits: number
  readonly currency: CurrencyCode
}

export function createMoney(minorUnits: number, currency: CurrencyCode = 'USD'): Money {
  return { minorUnits, currency }
}

export function moneyFromMajor(amount: number, currency: CurrencyCode = 'USD'): Money {
  return { minorUnits: Math.round(amount * 100), currency }
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('Currency mismatch')
  return { minorUnits: a.minorUnits + b.minorUnits, currency: a.currency }
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('Currency mismatch')
  return { minorUnits: a.minorUnits - b.minorUnits, currency: a.currency }
}

// ─── Coordinates / Geo ───
export interface Coordinates {
  readonly lat: number
  readonly lng: number
}

export interface GeoPoint {
  readonly type: 'Point'
  readonly coordinates: [number, number] // [lng, lat] GeoJSON order
}

export function createCoordinates(lat: number, lng: number): Coordinates {
  if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90')
  if (lng < -180 || lng > 180) throw new Error('Longitude must be between -180 and 180')
  return { lat, lng }
}

export function coordinatesToGeoPoint(coords: Coordinates): GeoPoint {
  return { type: 'Point', coordinates: [coords.lng, coords.lat] }
}

export function geoPointToCoordinates(point: GeoPoint): Coordinates {
  return { lat: point.coordinates[1], lng: point.coordinates[0] }
}

// ─── Date range ───
export interface DateRange {
  readonly start: string // ISO date YYYY-MM-DD
  readonly end: string
}

export function createDateRange(start: string, end: string): DateRange {
  if (start > end) throw new Error('Start date must be before or equal to end date')
  return { start, end }
}

// ─── Pagination ───
export interface PaginationParams {
  readonly page: number
  readonly limit: number
  readonly sortBy?: string
  readonly sortOrder?: 'asc' | 'desc'
}

export interface PaginationMeta {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly totalPages: number
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[]
  readonly pagination: PaginationMeta
}

export function createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}

// ─── Locale / timezone ───
export type Locale = 'en' | 'es'
export type Timezone = string // IANA timezone e.g., 'America/Bogota'

// ─── Common result / error ───
export interface Result<T, E = Error> {
  readonly ok: boolean
  readonly value?: T
  readonly error?: E
}

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}