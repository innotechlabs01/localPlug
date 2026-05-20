import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const before = searchParams.get('before') // message ID for pagination

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 },
      )
    }

    const db = getDb()

    let sql = `
      SELECT
        m.*,
        sa.name as agent_name
      FROM messages m
      LEFT JOIN support_agents sa ON m.sender_type = 'agent' AND m.sender_id = CAST(sa.id AS TEXT)
      WHERE m.conversation_id = ?
    `
    const args: (string | number)[] = [parseInt(conversationId, 10)]

    if (before) {
      sql += ' AND m.id < ?'
      args.push(parseInt(before, 10))
    }

    sql += ' ORDER BY m.created_at DESC'
    sql += ' LIMIT ?'
    args.push(limit)

    const result = await db.execute({ sql, args })

    // Reverse to show oldest first
    const messages = result.rows.reverse()

    return NextResponse.json({
      success: true,
      messages,
      hasMore: messages.length === limit,
    })
  } catch (error) {
    console.error('[Chat API] Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 },
    )
  }
}
