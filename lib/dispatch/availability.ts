import { getDb } from '@/lib/db'

export interface TimeSlot {
  start: string
  end: string
}

export interface AvailabilityCheck {
  driverId: number
  pickupDate: string
  pickupTime: string
  estimatedDurationMinutes: number
  isDropoff: boolean
  excludeAssignmentId?: number
}

export interface AvailabilityResult {
  available: boolean
  conflicts: {
    assignmentId: number
    orderId: number
    pickupDate: string
    pickupTime: string
    blockUntil: string
    status: string
  }[]
}

const DROPOFF_BLOCK_MINUTES = 120
const DEFAULT_BLOCK_MINUTES = 90

function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(Number)
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0
  return parts[0] * 60 + parts[1]
}

function minutesToEndTime(date: string, time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
  d.setMinutes(d.getMinutes() + minutes)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildBlockUntil(date: string, time: string, durationMinutes: number, isDropoff: boolean): string {
  const blockMinutes = isDropoff ? DROPOFF_BLOCK_MINUTES : Math.max(durationMinutes + 30, DEFAULT_BLOCK_MINUTES)
  return minutesToEndTime(date, time, blockMinutes)
}

export async function checkDriverAvailability(
  check: AvailabilityCheck,
): Promise<AvailabilityResult> {
  const db = getDb()
  const blockUntil = buildBlockUntil(check.pickupDate, check.pickupTime, check.estimatedDurationMinutes, check.isDropoff)
  const proposedStart = `${check.pickupDate} ${check.pickupTime}`

  let sql = `
    SELECT id, order_id, pickup_date, pickup_time, block_until, status
    FROM assignments
    WHERE driver_id = ?
      AND status IN ('pending_acceptance', 'accepted', 'confirmed_to_client')
      AND block_until > ?
  `
  const args: (string | number)[] = [check.driverId, proposedStart]

  if (check.excludeAssignmentId) {
    sql += ' AND id != ?'
    args.push(check.excludeAssignmentId)
  }

  sql += ' ORDER BY pickup_date, pickup_time'

  const result = await db.execute({ sql, args })

  const conflicts: AvailabilityResult['conflicts'] = []
  for (const row of result.rows) {
    const existingStart = `${row.pickup_date as string} ${row.pickup_time as string}`
    const existingEnd = row.block_until as string

    if (proposedStart < existingEnd && blockUntil > existingStart) {
      conflicts.push({
        assignmentId: row.id as number,
        orderId: row.order_id as number,
        pickupDate: row.pickup_date as string,
        pickupTime: row.pickup_time as string,
        blockUntil: existingEnd,
        status: row.status as string,
      })
    }
  }

  return {
    available: conflicts.length === 0,
    conflicts,
  }
}

export function getEstimatedDurationMinutes(packageName: string, isDropoff: boolean): number {
  if (isDropoff) return 60

  const name = (packageName || '').toLowerCase()
  if (name.includes('vip') || name.includes('premium')) return 90
  if (name.includes('hour') || name.includes('tour')) return 180
  return 60
}
