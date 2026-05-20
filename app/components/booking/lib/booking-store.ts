import type { Booking } from './types'

interface StoreEntry {
  key: string
  booking: Booking
}

function normalize(val: string): string {
  return val.trim().toLowerCase()
}

function buildKey(airline: string, flightNumber: string): string {
  return `${normalize(airline)}:${normalize(flightNumber)}`
}

class BookingStore {
  private entries: StoreEntry[] = []

  add(booking: Booking): void {
    if (!booking.flight?.airline || !booking.flight?.flightNumber) return
    this.entries.push({
      key: buildKey(booking.flight.airline, booking.flight.flightNumber),
      booking,
    })
  }

  search(airline: string, flightNumber: string): Booking[] {
    const searchKey = buildKey(airline, flightNumber)
    return this.entries
      .filter((e) => e.key === searchKey)
      .map((e) => e.booking)
  }

  clear(): void {
    this.entries = []
  }

  count(): number {
    return this.entries.length
  }
}

export const bookingStore = new BookingStore()
