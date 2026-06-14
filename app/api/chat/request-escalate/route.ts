import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerEscalation } from '@/lib/n8n/client'

export async function POST(request: Request) {
  try {
    const { conversationId, locale } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    const db = getDb()

    const convResult = await db.execute({
      sql: 'SELECT id, user_identifier, status FROM conversations WHERE id = ?',
      args: [conversationId],
    })

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const conv = convResult.rows[0] as unknown as { id: number; user_identifier: string; status: string }

    if (conv.status !== 'ai_active') {
      return NextResponse.json(
        { error: 'Conversation is not in AI mode' },
        { status: 400 }
      )
    }

    await db.execute({
      sql: "UPDATE conversations SET status = 'escalated', updated_at = datetime('now') WHERE id = ?",
      args: [conversationId],
    })

    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'system', ?, 'escalation')`,
      args: [conversationId, 'User requested human agent'],
    })

    triggerEscalation({
      conversationId,
      reason: 'User requested human agent via widget',
      userIdentifier: conv.user_identifier,
    }).catch((err) => {
      console.error('[RequestEscalate] n8n trigger failed:', err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[RequestEscalate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to request escalation' },
      { status: 500 }
    )
  }
}
