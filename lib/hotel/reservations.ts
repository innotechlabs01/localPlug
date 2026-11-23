import { getDb } from '@/lib/db'
import type { Reservation } from '@/lib/reservations-types'

// Map DB statuses to frontend statuses
const STATUS_MAP: Record<string, string> = {
  'new': 'pending',
  'accepted': 'confirmed',
  'checked_in': 'in_progress',
  'completed': 'completed',
  'cancelled': 'cancelled',
}

/**
 * Fetch reservations (orders) scoped to a specific hotel.
 */
export async function getHotelReservations(hotelId: number): Promise<Reservation[]> {
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT
            o.id, o.order_number, o.booking_reference,
            o.customer_name, o.customer_email, o.customer_phone,
            o.customer_country, o.customer_notes,
            o.package_id, o.package_name, o.package_price, o.currency,
            o.flight_number, o.airline, o.arrival_date, o.arrival_time,
            o.return_date, o.return_time,
            o.destination_address, o.destination_has_place, o.additional_trips,
            o.traveler_profile,
            o.status, o.dispatch_status,
            COALESCE(p.status, o.payment_status) AS payment_status,
            o.payment_id,
            o.priority, o.internal_notes,
            o.assigned_to, o.assigned_at,
            o.room_id, o.num_nights, o.is_hotel_booking,
            o.created_at, o.updated_at,
            d.name  AS driver_name,
            d.phone AS driver_phone
          FROM orders o
          LEFT JOIN drivers d ON o.assigned_to = d.id
          LEFT JOIN payments p ON o.booking_reference = p.booking_reference
          WHERE o.hotel_id = ?
          ORDER BY o.arrival_date DESC, o.arrival_time DESC`,
    args: [hotelId],
  })

  return (result.rows || []).map((row: any) => ({
    id: String(row.id),
    guest: {
      id: `guest_${row.id}`,
      firstName: row.customer_name?.split(' ')[0] || 'Unknown',
      lastName: row.customer_name?.split(' ').slice(1).join(' ') || '',
      email: row.customer_email || '',
      phone: row.customer_phone || '',
      country: row.customer_country || 'N/A',
    },
    service: {
      id: row.package_id || '',
      name: row.package_name || 'Standard Package',
      description: `${row.package_name} — ${row.package_price} ${(row.currency || 'usd').toUpperCase()}`,
    },
    arrivalDate: row.arrival_date || '',
    arrivalTime: row.arrival_time || '',
    flightInfo: row.flight_number && row.airline
      ? `${row.airline}${row.flight_number} — Arriving ${row.arrival_time}`
      : row.flight_number || 'Not provided',
    status: STATUS_MAP[row.status as string] || row.status || 'pending',
    paymentStatus: row.payment_status || 'pending',
    totalAmount: row.package_price || 0,
    specialRequests: row.customer_notes || '',
    vipStatus: 'none',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    orderNumber: row.order_number,
    bookingReference: row.booking_reference,
    driverAssigned: row.assigned_to
      ? { id: row.assigned_to, name: row.driver_name || 'Unknown', phone: row.driver_phone || '' }
      : undefined,
    dispatchStatus: row.dispatch_status || 'pending',
    destinationAddress: row.destination_address,
    additionalTrips: row.additional_trips
      ? (typeof row.additional_trips === 'string' ? JSON.parse(row.additional_trips) : row.additional_trips)
      : [],
    returnDate: row.return_date || '',
    returnTime: row.return_time || '',
    travelerProfile: row.traveler_profile || '',
  } satisfies Reservation))
}

/**
 * Count reservations by status for a given hotel.
 */
export async function getHotelReservationStats(hotelId: number) {
  const db = getDb()

  const result = await db.execute({
    sql: `SELECT status, COUNT(*) AS cnt
          FROM orders
          WHERE hotel_id = ?
          GROUP BY status`,
    args: [hotelId],
  })

  const stats: Record<string, number> = {}
  for (const row of result.rows) {
    stats[row.status as string] = Number(row.cnt)
  }
  return stats
}
