import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { conversationId, rating, comment } = body

    if (!conversationId || !rating) {
      return NextResponse.json({ error: 'conversationId and rating are required' }, { status: 400 })
    }

    const db = getDb()
    await db.execute({
      sql: `INSERT INTO conversation_ratings (conversation_id, rating, comment, created_at)
            VALUES (?, ?, ?, datetime('now'))`,
      args: [conversationId, rating, comment || null],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Rating API] error:', error)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}
