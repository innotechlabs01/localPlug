import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE clerk_id = ?',
      args: [userId],
    })

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const internalUserId = Number(userResult.rows[0].id)

    const saResult = await db.execute({
      sql: 'SELECT id FROM support_agents WHERE user_id = ?',
      args: [internalUserId],
    })

    if (saResult.rows.length === 0) {
      return NextResponse.json({ success: true, agentId: null })
    }

    return NextResponse.json({ success: true, agentId: Number(saResult.rows[0].id) })
  } catch (error) {
    console.error('[Chat API] agent-me error:', error)
    return NextResponse.json({ error: 'Failed to get agent' }, { status: 500 })
  }
}
