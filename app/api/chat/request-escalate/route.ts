import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { triggerEscalation } from '@/lib/n8n/client'
import { findAvailableAgent, incrementAgentLoad } from '@/lib/services/agent-service'

export async function POST(request: Request) {
  try {
    const { conversationId, locale, topic } = await request.json()

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

    const availableAgent = await findAvailableAgent(topic)

    if (availableAgent) {
      await db.execute({
        sql: "UPDATE conversations SET status = 'human_active', assigned_agent_id = ?, assigned_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        args: [availableAgent.id, conversationId],
      })

      await incrementAgentLoad(availableAgent.id)

      await db.execute({
        sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type)
              VALUES (?, 'system', ?, 'assignment')`,
        args: [conversationId, `Assigned to ${availableAgent.name}`],
      })

      triggerEscalation({
        conversationId,
        reason: 'User requested human agent via widget',
        userIdentifier: conv.user_identifier,
        assignedAgentId: availableAgent.id,
        agentAvailable: true,
      }).catch((err) => {
        console.error('[RequestEscalate] n8n trigger failed:', err)
      })

      return NextResponse.json({
        success: true,
        agentAssigned: true,
        agentName: availableAgent.name,
      })
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
      agentAvailable: false,
    }).catch((err) => {
      console.error('[RequestEscalate] n8n trigger failed:', err)
    })

    return NextResponse.json({ success: true, agentAssigned: false })
  } catch (error) {
    console.error('[RequestEscalate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to request escalation' },
      { status: 500 }
    )
  }
}
