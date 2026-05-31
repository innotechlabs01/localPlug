import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const before = searchParams.get('before')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 },
      )
    }

    const db = getDb()

    // Check if this is a web channel conversation (public)
    const convResult = await db.execute({
      sql: 'SELECT channel, status FROM conversations WHERE id = ?',
      args: [parseInt(conversationId, 10)],
    })

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      )
    }

    const conversation = convResult.rows[0] as { channel: string; status: string }
    const isWebChannel = conversation.channel === 'web'

    // Only require Clerk auth for non-web channels
    if (!isWebChannel) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        )
      }

      const userResult = await db.execute({
        sql: 'SELECT id, role_id FROM users WHERE clerk_id = ?',
        args: [userId],
      })

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 },
        )
      }

      const roleId = (userResult.rows[0] as { role_id: number | null }).role_id
      if (roleId === null) {
        return NextResponse.json(
          { error: 'Forbidden: insufficient permissions' },
          { status: 403 },
        )
      }
    }

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
    const messages = result.rows.reverse()

    return NextResponse.json({
      success: true,
      messages,
      hasMore: messages.length === limit,
      status: conversation.status,
    })
  } catch (error) {
    console.error('[Chat API] Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 },
    )
  }
}