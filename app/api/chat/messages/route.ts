import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: Request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's internal ID and role from the database using the clerk_id
    const db = await import('@/lib/db').then(mod => mod.getDb())
    const userResult = await db.execute({
      sql: 'SELECT id, role_id FROM users WHERE clerk_id = ?',
      args: [userId]
    })

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userIdInternal = userResult.rows[0].id
    const roleId = userResult.rows[0].role_id

    // Check if the user is an agent/admin (has a role_id assigned)
    if (roleId === null) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      )
    }

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
