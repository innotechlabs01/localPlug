import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const userIdentifier = searchParams.get('userIdentifier')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const before = searchParams.get('before')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 },
      )
    }

    const db = getDb()

    // Check conversation channel and owner
    const convResult = await db.execute({
      sql: 'SELECT channel, status, user_identifier FROM conversations WHERE id = ?',
      args: [parseInt(conversationId, 10)],
    })

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      )
    }

    const conversationRow = convResult.rows[0]
    const channel = conversationRow.channel as string
    const status = conversationRow.status as string
    const ownerIdentifier = conversationRow.user_identifier as string | null
    const isWebChannel = channel === 'web'

    const matchesUser = Boolean(isWebChannel && userIdentifier && ownerIdentifier && userIdentifier === ownerIdentifier)

    if (!matchesUser) {
      const { userId } = await auth()
      const matchesClerk = Boolean(isWebChannel && userId && ownerIdentifier && userId === ownerIdentifier)
      if (!matchesClerk) {
        const isStaff = userId ? !(await requirePermission('support', 'view')) : false
        if (!isStaff) {
          return NextResponse.json(
            { error: userId ? 'Forbidden: insufficient permissions' : 'Unauthorized' },
            { status: userId ? 403 : 401 },
          )
        }
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
       status: status,
     })
  } catch (error) {
    console.error('[Chat API] Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 },
    )
  }
}