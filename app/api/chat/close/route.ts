import { NextResponse } from 'next/server'
import { closeConversation, releaseToAIMode } from '@/lib/services/chat-service'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  try {
    const { conversationId, closedBy, releaseToAi } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    let conversation

    if (releaseToAi) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const db = await import('@/lib/db').then(mod => mod.getDb())
      const userResult = await db.execute({
        sql: 'SELECT id FROM users WHERE clerk_id = ?',
        args: [userId]
      })
      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      const agentId = Number(userResult.rows[0].id)
      conversation = await releaseToAIMode(conversationId, agentId, closedBy)
    } else if (closedBy !== 'user') {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      conversation = await closeConversation(conversationId, closedBy || 'agent')
    } else {
      conversation = await closeConversation(conversationId, 'user')
    }

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or cannot be updated' },
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
