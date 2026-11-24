import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET() {
  try {
    const authError = await requirePermission('support', 'view')
    if (authError) return authError

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const userResult = await db.execute({
      sql: 'SELECT id, name, email, phone FROM users WHERE clerk_id = ?',
      args: [userId],
    })

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const u = userResult.rows[0] as any
    const internalUserId = Number(u.id)
    const email = String(u.email || '').trim().toLowerCase()

    const saResult = await db.execute({
      sql: 'SELECT id FROM support_agents WHERE user_id = ? OR (LOWER(email) = ? AND ? != \'\') LIMIT 1',
      args: [internalUserId, email, email],
    })

    if (saResult.rows.length > 0) {
      return NextResponse.json({ success: true, agentId: Number(saResult.rows[0].id) })
    }

    // Auto-create support_agents profile for authenticated staff member
    const ins = await db.execute({
      sql: `INSERT INTO support_agents (user_id, name, email, phone, status, max_conversations)
            VALUES (?, ?, ?, ?, 'available', 5)`,
      args: [internalUserId, String(u.name || email || 'Agent'), email, u.phone ? String(u.phone) : null],
    })

    return NextResponse.json({ success: true, agentId: Number(ins.lastInsertRowid) })
  } catch (error) {
    console.error('[Chat API] agent-me error:', error)
    return NextResponse.json({ error: 'Failed to get agent' }, { status: 500 })
  }
}
