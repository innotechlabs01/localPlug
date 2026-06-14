import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const flagged = searchParams.get('flagged')
    const agentId = searchParams.get('agentId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let sql = `
      SELECT
        c.*,
        sa.name as agent_name,
        sa.email as agent_email,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
        (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM conversations c
      LEFT JOIN support_agents sa ON c.assigned_agent_id = sa.id
      WHERE 1=1
    `
    const args: (string | number)[] = []

    if (status) {
      sql += ' AND c.status = ?'
      args.push(status)
    }

    if (flagged === 'true') {
      sql += ' AND c.flagged = 1'
    }

    if (agentId) {
      sql += ' AND c.assigned_agent_id = ?'
      args.push(parseInt(agentId, 10))
    }

    sql += ' ORDER BY c.last_message_at DESC, c.created_at DESC'
    sql += ' LIMIT ? OFFSET ?'
    args.push(limit, offset)

    const result = await db.execute({ sql, args })

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM conversations WHERE 1=1'
    const countArgs: (string | number)[] = []

    if (status) {
      countSql += ' AND status = ?'
      countArgs.push(status)
    }

    if (flagged === 'true') {
      countSql += ' AND flagged = 1'
    }

    const countResult = await db.execute({ sql: countSql, args: countArgs })
    const total = Number(countResult.rows[0]?.total || 0)

    return NextResponse.json({
      success: true,
      conversations: result.rows,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Chat API] List conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to list conversations' },
      { status: 500 },
    )
  }
}
