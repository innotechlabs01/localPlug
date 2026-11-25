/**
 * Canonical Domain Event Catalog for LocalPlug Event-Driven Architecture.
 */
export type DomainEventType =
  | 'booking.created'
  | 'payment.completed'
  | 'payment.refunded'
  | 'driver.assigned'
  | 'driver.assignment_accepted'
  | 'driver.assignment_declined'
  | 'driver.en_route'
  | 'trip.pickedup'
  | 'driver.trip_completed'
  | 'driver.trip_cancelled'
  | 'driver.reschedule_requested'
  | 'parking_proof.submitted'
  | 'parking_proof.approved'
  | 'parking_proof.rejected'
  | 'hotel.room_confirmed'
  | 'hotel.room_declined'
  | 'hotel.guest_checked_in'
  | 'hotel.guest_checked_out'
  | 'hotel.reschedule_requested'
  | 'hotel.room_ready'
  | 'hotel.room_cancelled'
  | 'chat.message_received'
  | 'chat.escalated'
  | 'payout.requested'
  | 'payout.settled'
  | 'rating.submitted'

export interface DomainEventEnvelope<T = Record<string, unknown>> {
  id: number
  type: DomainEventType | (string & {})
  payload: T
  correlation_id: string | null
  created_at: string
}
