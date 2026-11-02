'use server'

import { getDb } from '@/lib/db'

export type AuditActorType = 'driver' | 'admin' | 'dispatch' | 'system'

export type AuditAction =
  | 'offered'
  | 'accepted'
  | 'declined'
  | 'en_route'
  | 'pickedup'
  | 'completed'
  | 'cancelled'
  | 'reschedule_requested'
  | 'parking_proof_submitted'

export interface RecordAuditInput {
  assignmentId: number
  orderId: number
  driverId: number
  actorType: AuditActorType
  actorId?: number
  actorName?: string
  action: AuditAction
  fromStatus?: string
  toStatus: string
  reason?: string
  metadata?: Record<string, unknown>
}

/**
 * Append-only, immutable audit record for every driver assignment state change.
 * Never throws on insert — the business write must not fail because of audit.
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    const db = getDb()
    await db.execute({
      sql: `INSERT INTO driver_audit_log (
        assignment_id, order_id, driver_id, actor_type, actor_id, actor_name,
        action, from_status, to_status, reason, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        input.assignmentId,
        input.orderId,
        input.driverId,
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
    console.error('[driver-audit] failed to write audit record:', err)
  }
}
