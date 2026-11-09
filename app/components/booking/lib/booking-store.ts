import type { Booking } from './types'

function normalize(val: string): string {
  return val.trim().toLowerCase()
}

function buildKey(airline: string, flightNumber: string): string {
  return `${normalize(airline)}:${normalize(flightNumber)}`
}

/**
 * BookingStore
 *
 * Performance optimization:
 * Replaced linear array scanning (O(n)) with a Map-based hash index (O(1)).
 * When searching by (airline, flightNumber), `search` retrieves bookings via
 * direct hash index lookup in O(1) average time instead of iterating and
 * filtering through every stored entry across all flights.
 */
class BookingStore {
  private index = new Map<string, Booking[]>()
  private totalCount = 0

  add(booking: Booking): void {
    if (!booking.flight?.airline || !booking.flight?.flightNumber) return
    const key = buildKey(booking.flight.airline, booking.flight.flightNumber)
    const bucket = this.index.get(key)
    if (bucket) {
      bucket.push(booking)
    } else {
      this.index.set(key, [booking])
    }
    this.totalCount++
  }

  search(airline: string, flightNumber: string): Booking[] {
    const searchKey = buildKey(airline, flightNumber)
    const matches = this.index.get(searchKey)
    return matches ? matches.slice() : []
  }

  clear(): void {
    this.index.clear()
    this.totalCount = 0
  }

  count(): number {
    return this.totalCount
  }
}

export const bookingStore = new BookingStore()
