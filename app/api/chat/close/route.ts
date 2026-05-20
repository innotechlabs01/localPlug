import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { t } from '@/lib/i18n/server'

interface CloseRequest {
  conversationId: number
  closedBy: 'user' | 'agent' | 'ai'
  reason?: string
  locale?: string
}

export async function POST(request: Request) {
  try {
    const body: CloseRequest = await request.json()
    const { conversationId, closedBy, reason, locale } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 },
      )
    }

    const db = getDb()

    // Get conversation details
    const convResult = await db.execute({
      sql: 'SELECT * FROM conversations WHERE id = ?',
      args: [conversationId],
    })

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 },
      )
    }

    const conversation = convResult.rows[0]

    // Update conversation status
    await db.execute({
      sql: `UPDATE conversations SET status = 'closed', updated_at = datetime('now') WHERE id = ?`,
      args: [conversationId],
    })

    // If agent was assigned, decrement their conversation count
    if (conversation.assigned_agent_id) {
      await db.execute({
        sql: `UPDATE support_agents
              SET current_conversations = MAX(0, current_conversations - 1),
                  status = CASE WHEN current_conversations <= 1 THEN 'available' ELSE status END,
                  last_active_at = datetime('now')
              WHERE id = ?`,
        args: [conversation.assigned_agent_id],
      })
    }

    // Add system message about closure
    const closeMessage = reason
      ? t(locale || 'en', 'chat.closed', { reason })
      : `Conversation closed by ${closedBy}`
    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'system', ?, 'text')`,
      args: [conversationId, closeMessage],
    })

    return NextResponse.json({
      success: true,
      closed: true,
    })
  } catch (error) {
    console.error('[Chat API] Close error:', error)
    return NextResponse.json(
      { error: 'Failed to close conversation' },
      { status: 500 },
    )
  }
}
