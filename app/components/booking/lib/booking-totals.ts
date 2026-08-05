export interface BookingTotalsInput {
  basePrice: number
  servicePrice?: number
  returnCharge: number
  tourPrices: number[]
  numPeople: number
  serviceFee: number
  taxRate: number
}

export interface BookingTotals {
  basePrice: number
  serviceTotal: number
  returnCharge: number
  toursTotal: number
  subtotal: number
  serviceFee: number
  iva: number
  total: number
}

export function computeBookingTotals({
  basePrice,
  servicePrice = 0,
  returnCharge,
  tourPrices = [],
  numPeople = 1,
  serviceFee,
  taxRate,
}: BookingTotalsInput): BookingTotals {
  const people = Math.max(1, Math.floor(numPeople || 1))
  const serviceTotal = (servicePrice || 0) * people
  const toursTotal = tourPrices.reduce((sum, price) => sum + price * people, 0)
  const subtotal = basePrice + serviceTotal + returnCharge + toursTotal
  const iva = (subtotal - serviceFee) * taxRate
  return {
    basePrice,
    serviceTotal,
    returnCharge,
    toursTotal,
    subtotal,
    serviceFee,
    iva,
    total: subtotal + serviceFee + iva,
  }
}
