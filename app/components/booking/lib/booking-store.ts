import { getDb } from '@/lib/db'
import type { Booking } from './types'

function normalize(val: string): string {
  return val.trim().toLowerCase()
}

function buildKey(airline: string, flightNumber: string): string {
  return `${normalize(airline)}:${normalize(flightNumber)}`
}

interface OrderRow {
  order_number: string
  booking_reference: string
  flight_number: string | null
  airline: string | null
}

class BookingStore {
  add(booking: Booking): void {
    if (!booking.flight?.airline || !booking.flight?.flightNumber) return
  }

  async search(airline: string, flightNumber: string): Promise<Booking[]> {
    const searchKey = buildKey(airline, flightNumber)
    const [airlinePart, flightPart] = searchKey.split(':')

    try {
      const db = getDb()
      const result = await db.execute({
        sql: `SELECT * FROM orders WHERE LOWER(airline) = ? AND LOWER(flight_number) = ?`,
        args: [airlinePart, flightPart],
      })

      return result.rows.map(mapRowToBooking)
    } catch (err) {
      console.error('[BookingStore] search error:', err)
      return []
    }
  }

  clear(): void {
  }

  async count(): Promise<number> {
    try {
      const db = getDb()
      const result = await db.execute({ sql: `SELECT COUNT(*) as cnt FROM orders`, args: [] })
      return Number(result.rows[0]?.cnt || 0)
    } catch {
      return 0
    }
  }
}

function mapRowToBooking(row: Record<string, unknown>): Booking {
  return {
    id: (row.booking_reference as string) || '',
    flight: {
      flightNumber: (row.flight_number as string) || '',
      airline: (row.airline as string) || '',
      arrivalDate: (row.arrival_date as string) || '',
      arrivalTime: (row.arrival_time as string) || '',
      needReturn: !!(row.return_date),
      returnDate: (row.return_date as string) || '',
      returnTime: (row.return_time as string) || '',
    },
    profile: (row.traveler_profile as string) || '',
    destination: {
      hasPlace: !!(row.destination_has_place),
      address: (row.destination_address as string) || '',
      wantsGuatape: false,
      additionalTrips: row.additional_trips ? JSON.parse(row.additional_trips as string) : undefined,
    },
    package: (row.package_id as string) || '',
    status: mapStatus(row.status as string),
    createdAt: '',
  }
}

function mapStatus(status: string): Booking['status'] {
  if (status === 'new' || status === 'draft') return 'draft'
  if (status === 'confirmed') return 'confirmed'
  return 'submitted'
}

export const bookingStore = new BookingStore()
