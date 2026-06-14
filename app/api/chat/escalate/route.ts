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

    // Use support_agents.id if linked, fall back to users.id
    const agentId = saResult.rows.length > 0
      ? Number(saResult.rows[0].id)
      : Number(userId)

    const conversation = await takeOverConversation(Number(conversationId), agentId, reason)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or cannot be taken over' },
        { status: 404 }
      )
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