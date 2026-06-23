import { NextResponse } from 'next/server'
import { takeOverConversation } from '@/lib/services/chat-service'
import { auth } from '@clerk/nextjs/server'

/**
 * POST /api/chat/escalate
 * Admin takes manual control of a WhatsApp conversation (Take Over)
 */
export async function POST(request: Request) {
  try {
    const { conversationId, reason } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user from Clerk
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's internal ID and role from the database using the clerk_id
    const db = await import('@/lib/db').then(mod => mod.getDb())
    const userResult = await db.execute({
      sql: 'SELECT id, role_id FROM users WHERE clerk_id = ?',
      args: [clerkUserId]
    })

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = userResult.rows[0].id as number
    const roleId = userResult.rows[0].role_id

    // Check if the user is an agent/admin (has a role_id assigned)
    if (roleId === null) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      )
    }

    // Find the linked support_agents record via user_id
    const saResult = await db.execute({
      sql: 'SELECT id FROM support_agents WHERE user_id = ?',
      args: [userId],
    })

    let agentId: number

    if (saResult.rows.length > 0) {
      agentId = Number(saResult.rows[0].id)
    } else {
      // Auto-create a support_agents record for this admin user
      const userResult2 = await db.execute({
        sql: 'SELECT id, email, name FROM users WHERE id = ?',
        args: [userId],
      })

      if (userResult2.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const userRow = userResult2.rows[0] as unknown as { id: number; email: string; name: string }
      const insertResult = await db.execute({
        sql: `INSERT INTO support_agents (user_id, name, email, status, max_conversations, current_conversations)
              VALUES (?, ?, ?, 'available', 5, 0)`,
        args: [userRow.id, userRow.name || userRow.email, userRow.email],
      })
      agentId = Number(insertResult.lastInsertRowid)
    }

    const conversation = await takeOverConversation(Number(conversationId), agentId, reason)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or cannot be taken over' },
        { status: 404 }
      )
    }

    // Auto-assign other unassigned human_active conversations if agent has capacity
    const { findAvailableAgent: findAgent, incrementAgentLoad: incLoad } = await import('@/lib/services/agent-service')
    const unassigned = await db.execute({
      sql: `SELECT id FROM conversations WHERE status = 'human_active' AND assigned_agent_id IS NULL AND id != ? ORDER BY created_at ASC`,
      args: [conversationId],
    })

    for (const row of unassigned.rows) {
      const agent = await findAgent()
      if (!agent) break
      await db.execute({
        sql: `UPDATE conversations SET assigned_agent_id = ?, assigned_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
        args: [agent.id, row.id],
      })
      await incLoad(agent.id)
      await db.execute({
        sql: `INSERT INTO messages (conversation_id, sender_type, content, message_type) VALUES (?, 'system', ?, 'assignment')`,
        args: [row.id, `Auto-assigned to ${agent.name}`],
      })
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        status: conversation.status,
        assigned_agent_id: conversation.assigned_agent_id
      }
    })
  } catch (error) {
    console.error('Error in escalate endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}