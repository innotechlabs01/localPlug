export interface TourSelection {
  price: number
  numPeople: number
}

export interface BookingTotalsInput {
  basePrice: number
  serviceFeeFlat?: number
  returnCharge: number
  tours?: TourSelection[]
  serviceFee: number
  taxRate: number
}

export interface BookingTotals {
  basePrice: number
  serviceFeeFlat: number
  returnCharge: number
  toursTotal: number
  subtotal: number
  serviceFee: number
  iva: number
  total: number
}

export function computeBookingTotals({
  basePrice,
  serviceFeeFlat = 0,
  returnCharge,
  tours = [],
  serviceFee,
  taxRate,
}: BookingTotalsInput): BookingTotals {
  const toursTotal = tours.reduce((sum, t) => sum + t.price * t.numPeople, 0)
  const subtotal = basePrice + serviceFeeFlat + returnCharge + toursTotal
  const iva = (subtotal - serviceFee) * taxRate
  return {
    basePrice,
    serviceFeeFlat,
    returnCharge,
    toursTotal,
    subtotal,
    serviceFee,
    iva,
    total: subtotal + serviceFee + iva,
  }
}
