import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const [total, newCount, inProgress, urgent, completed] = await Promise.all([
    db.execute('SELECT COUNT(*) as count FROM orders'),
    db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'new'"),
    db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'in_progress'"),
    db.execute("SELECT COUNT(*) as count FROM orders WHERE priority = 'urgent'"),
    db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'"),
  ])

  return NextResponse.json({
    total: total.rows[0].count,
    new: newCount.rows[0].count,
    inProgress: inProgress.rows[0].count,
    urgent: urgent.rows[0].count,
    completed: completed.rows[0].count,
  })
}
