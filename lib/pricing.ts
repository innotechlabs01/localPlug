// This module is kept for backward compatibility.
// Consumers should migrate to @/lib/config directly over time.

import {
  getPackagePrice as _getPackagePrice,
  getPackagePriceCents as _getPackagePriceCents,
  getPackageName as _getPackageName,
  getPackageTotal as _getPackageTotal,
  getPackageTotalCents as _getPackageTotalCents,
  getReturnTripCharge as _getReturnTripCharge,
  getReturnTripChargeCents as _getReturnTripChargeCents,
} from '@/lib/config'

export type PackageId = 'smooth-landing' | 'first-24' | 'full-insider'

export const PACKAGES = {
  'smooth-landing': { name: 'The VIP Arrival', price: 89, priceCents: 8900 },
  'first-24': { name: 'The 24h Insider', price: 159, priceCents: 15900 },
  'full-insider': { name: 'The Peace of Mind', price: 269, priceCents: 26900 },
} as const

export const RETURN_TRIP_CHARGE = 48
export const RETURN_TRIP_CHARGE_CENTS = 4800

export function getPackagePrice(packageId: string): number {
  return PACKAGES[packageId as PackageId]?.price || 0
}

export function getPackagePriceCents(packageId: string): number {
  return PACKAGES[packageId as PackageId]?.priceCents || 0
}

export function getPackageName(packageId: string): string {
  return PACKAGES[packageId as PackageId]?.name || packageId
}

export function getPackageTotal(packageId: string, needReturn: boolean): number {
  return getPackagePrice(packageId) + (needReturn ? RETURN_TRIP_CHARGE : 0)
}

export function getPackageTotalCents(packageId: string, needReturn: boolean): number {
  return getPackagePriceCents(packageId) + (needReturn ? RETURN_TRIP_CHARGE_CENTS : 0)
}

export async function getConfigPackagePrice(packageId: string): Promise<number> {
  return _getPackagePrice(packageId)
}

export async function getConfigPackagePriceCents(packageId: string): Promise<number> {
  return _getPackagePriceCents(packageId)
}

export async function getConfigPackageName(packageId: string): Promise<string> {
  return _getPackageName(packageId)
}

export async function getConfigPackageTotal(packageId: string, needReturn: boolean): Promise<number> {
  return _getPackageTotal(packageId, needReturn)
}

export async function getConfigPackageTotalCents(packageId: string, needReturn: boolean): Promise<number> {
  return _getPackageTotalCents(packageId, needReturn)
}

export async function getConfigReturnTripCharge(): Promise<number> {
  return _getReturnTripCharge()
}

export async function getConfigReturnTripChargeCents(): Promise<number> {
  return _getReturnTripChargeCents()
}
