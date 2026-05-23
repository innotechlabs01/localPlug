import { NextResponse } from 'next/server'
import { releaseToAIMode } from '@/lib/services/chat-service'
import { auth } from '@clerk/nextjs/server'

/**
 * POST /api/chat/close
 * Admin releases conversation back to AI control (AI Mode)
 */
export async function POST(request: Request) {
  try {
    const { conversationId, closedBy } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

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

    const agentId = userResult.rows[0].id
    const roleId = userResult.rows[0].role_id

    // Check if the user is an agent/admin (has a role_id assigned)
    if (roleId === null) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      )
    }

    const conversation = await releaseToAIMode(Number(conversationId), Number(agentId), closedBy)

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or cannot be released to AI mode' },
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
    console.error('Error in close endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}