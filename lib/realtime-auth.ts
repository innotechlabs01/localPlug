import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

/**
 * Verify that an authenticated Clerk user has an operational portal role
 * (admin/staff, driver, or hotel manager) before streaming internal outbox events.
 */
export async function canAccessRealtimeOutbox(userId: string): Promise<boolean> {
  if ((await requirePermission('dashboard', 'view')) === null) return true
  const db = getDb()
  const [driverRes, hotelRes] = await Promise.all([
    db.execute({ sql: `SELECT 1 FROM drivers WHERE clerk_user_id = ? LIMIT 1`, args: [userId] }),
    db.execute({ sql: `SELECT 1 FROM users WHERE clerk_user_id = ? AND hotel_id IS NOT NULL LIMIT 1`, args: [userId] }).catch(() => ({ rows: [] })),
  ])
  return driverRes.rows.length > 0 || hotelRes.rows.length > 0
}
