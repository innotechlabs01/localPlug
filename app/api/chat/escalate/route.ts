import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerEscalation } from '@/lib/n8n/client'
import { t } from '@/lib/i18n/server'

interface EscalateRequest {
  conversationId: number
  reason: string
  assignedAgentId?: number
  locale?: string
}

export async function POST(request: Request) {
  try {
    const body: EscalateRequest = await request.json()
    const { conversationId, reason, assignedAgentId, locale } = body

    if (!conversationId || !reason) {
      return NextResponse.json(
        { error: 'conversationId and reason are required' },
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

    // Find an available agent if not specified
    let agentId = assignedAgentId
    if (!agentId) {
      const agentResult = await db.execute({
        sql: `SELECT id FROM support_agents
              WHERE status = 'available' AND current_conversations < max_conversations
              ORDER BY current_conversations ASC
              LIMIT 1`,
        args: [],
      })

      if (agentResult.rows.length > 0) {
        agentId = Number(agentResult.rows[0].id)
      }
    }

    // Update conversation
    const updateSql = `
      UPDATE conversations
      SET status = 'escalated',
          assigned_agent_id = ?,
          assigned_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `
    await db.execute({ sql: updateSql, args: [agentId || null, conversationId] })

    // If agent assigned, update to human_active
    if (agentId) {
      await db.execute({
        sql: `UPDATE conversations SET status = 'human_active', updated_at = datetime('now') WHERE id = ?`,
        args: [conversationId],
      })

      // Increment agent conversation count
      await db.execute({
        sql: `UPDATE support_agents SET current_conversations = current_conversations + 1, status = 'busy', last_active_at = datetime('now') WHERE id = ?`,
        args: [agentId],
      })
    }

    // Add system message about escalation
    await db.execute({
      sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
            VALUES (?, 'system', ?, 'escalation')`,
      args: [conversationId, t(locale || 'en', 'chat.escalated', { reason })],
    })

    // Trigger n8n escalation workflow
    await triggerEscalation({
      conversationId,
      reason,
      userIdentifier: String(conversation.user_identifier),
      assignedAgentId: agentId,
    })

    return NextResponse.json({
      success: true,
      assignedAgentId: agentId,
      status: agentId ? 'human_active' : 'escalated',
    })
  } catch (error) {
    console.error('[Chat API] Escalate error:', error)
    return NextResponse.json(
      { error: 'Failed to escalate conversation' },
      { status: 500 },
    )
  }
}
