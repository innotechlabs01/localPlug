export const PACKAGES = {
  'smooth-landing': { name: 'The VIP Arrival', price: 89, priceCents: 8900 },
  'first-24': { name: 'The 24h Insider', price: 159, priceCents: 15900 },
  'full-insider': { name: 'The Peace of Mind', price: 269, priceCents: 26900 },
} as const

export const RETURN_TRIP_CHARGE = 48
export const RETURN_TRIP_CHARGE_CENTS = 4800

export type PackageId = keyof typeof PACKAGES

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
