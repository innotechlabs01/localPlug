import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { conversationId, message, confidence } = body

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'conversationId and message are required' },
        { status: 400 },
      )
    }

    const db = getDb()

    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type, metadata)
            VALUES (?, 'ai', ?, 'text', ?)`,
      args: [conversationId, message, JSON.stringify({ confidence: confidence || 1.0, source: 'n8n' })],
    })

    await db.execute({
      sql: `UPDATE conversations SET ai_confidence = ?, last_message_at = datetime('now'), updated_at = datetime('now')
            WHERE id = ?`,
      args: [confidence || 1.0, conversationId],
    })

    if (confidence && confidence < 0.5) {
      await db.execute({
        sql: `UPDATE conversations SET status = 'escalated', updated_at = datetime('now')
              WHERE id = ? AND status = 'ai_active'`,
        args: [conversationId],
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AI Response] Error:', error)
    return NextResponse.json(
      { error: 'Failed to store AI response' },
      { status: 500 },
    )
  }
}
