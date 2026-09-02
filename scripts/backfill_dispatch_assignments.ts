import { getDb } from '@/lib/db';

/**
 * Backfill legacy orders (IDs 1,3,4) that are stuck in `pending_acceptance`
 * to proper `assigned` state and set the driver assignment.
 */
export async function run() {
  const db = getDb();
  await db.execute({
    sql: `UPDATE orders
            SET assigned_to = (
              SELECT driver_id FROM assignments
               WHERE order_id = orders.id
                 AND status = 'pending_acceptance'
               LIMIT 1
            ),
            dispatch_status = 'assigned',
            assigned_at = datetime('now')
          WHERE dispatch_status = 'pending_acceptance'`,
    args: [],
  });
  console.log('Backfill completed');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Backfill failed', err);
    process.exit(1);
  });
}
