import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: Request) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')

  const sinceCondition = since ? `AND created_at > '${since}'` : ''

  const [orders, conversations, stats] = await Promise.all([
    // New orders since last check
    db.execute(`
      SELECT id, order_number, customer_name, package_name, status, dispatch_status, created_at
      FROM orders
      WHERE 1=1 ${sinceCondition}
      ORDER BY created_at DESC
      LIMIT 20
    `),

    // Active/escalated conversations
    db.execute(`
      SELECT c.id, c.user_name, c.status, c.priority, c.channel, c.last_message_at, c.created_at,
        (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM conversations c
      WHERE c.status IN ('escalated', 'human_active')
      ORDER BY c.last_message_at DESC
      LIMIT 20
    `),

    // Stats
    db.execute(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE status = 'new') as new_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'in_progress') as in_progress_orders,
        (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'pending') as pending_dispatch,
        (SELECT COUNT(*) FROM orders WHERE dispatch_status = 'assigned') as assigned_dispatch,
        (SELECT COUNT(*) FROM conversations WHERE status = 'escalated') as escalated_conversations,
        (SELECT COUNT(*) FROM conversations WHERE status = 'human_active') as active_conversations,
        (SELECT COUNT(*) FROM drivers WHERE status = 'available') as available_drivers,
        (SELECT COUNT(*) FROM drivers WHERE status = 'busy') as busy_drivers
    `),
  ])

  return NextResponse.json({
    orders: orders.rows,
    conversations: conversations.rows,
    stats: stats.rows[0] || {},
    timestamp: new Date().toISOString(),
  })
}
