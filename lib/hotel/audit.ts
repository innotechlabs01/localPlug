'use server'

import { getDb } from '@/lib/db'

export type HotelAuditActorType = 'hotel' | 'admin' | 'dispatch' | 'system'

export type HotelAuditAction =
  | 'accept_room'
  | 'decline_room'
  | 'check_in'
  | 'check_out'
  | 'reschedule_requested'
  | 'cancelled'
  | 'room_ready'

export interface RecordHotelAuditInput {
  orderId: number
  hotelId: number
  roomId?: number
  actorType: HotelAuditActorType
  actorId?: number
  actorName?: string
  action: HotelAuditAction
  fromStatus?: string
  toStatus: string
  reason?: string
  metadata?: Record<string, unknown>
}

/**
 * Append-only, immutable audit record for every hotel room/assignment state change.
 * Never throws on insert — the business write must not fail because of audit.
 */
export async function recordHotelAudit(input: RecordHotelAuditInput): Promise<void> {
  try {
    const db = getDb()
    await db.execute({
      sql: `INSERT INTO hotel_audit_log (
        order_id, hotel_id, room_id, actor_type, actor_id, actor_name,
        action, from_status, to_status, reason, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        input.orderId,
        input.hotelId,
        input.roomId ?? null,
        input.actorType,
        input.actorId ?? null,
        input.actorName ?? null,
        input.action,
        input.fromStatus ?? null,
        input.toStatus,
        input.reason ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ],
    })
  } catch (err) {
    console.error('[hotel-audit] failed to write audit record:', err)
  }
}
