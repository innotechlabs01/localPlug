import type { Reservation, ReservationStatus, PaymentStatus, VIPStatus, DriverInfo } from './reservations-types';
export type { Reservation, ReservationStatus, PaymentStatus, VIPStatus, DriverInfo };

export async function fetchReservations(): Promise<Reservation[]> {
  const response = await fetch('/api/admin/reservations')
  if (!response.ok) throw new Error('Failed to fetch reservations')
  const data = await response.json()
  return data.reservations || []
}

export async function fetchReservationById(id: string): Promise<Reservation | null> {
  const response = await fetch(`/api/admin/reservations/${id}`)
  if (!response.ok) return null
  const data = await response.json()
  return data.reservation || null
}

export async function assignDriverToReservation(reservationId: string, driverId: string): Promise<void> {
  const response = await fetch(`/api/admin/reservations/${reservationId}/assign-driver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId })
  })
  if (!response.ok) throw new Error('Failed to assign driver')
}

export async function sendWhatsAppMessage(reservationId: string, driverId?: string, driverName?: string, driverPhone?: string): Promise<void> {
  const response = await fetch(`/api/admin/reservations/${reservationId}/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, driverName, driverPhone })
  })
  if (!response.ok) throw new Error('Failed to send WhatsApp')
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const response = await fetch(`/api/admin/reservations/${reservationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error('Failed to cancel reservation')
}
