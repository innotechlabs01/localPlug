import { NextResponse } from 'next/server'
import { findAvailableAgent } from '@/lib/services/agent-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic') || undefined

    const agent = await findAvailableAgent(topic)

    return NextResponse.json({
      available: agent !== null,
      agent: agent
        ? { id: agent.id, name: agent.name, email: agent.email }
        : null,
    })
  } catch (error) {
    console.error('[Agent Available] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check agent availability' },
      { status: 500 },
    )
  }
}
