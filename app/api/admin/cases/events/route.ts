import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { case_id, event_type, title, description, author } = body

    if (!case_id || !event_type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `INSERT INTO case_events (case_id, event_type, title, description, author)
            VALUES (?, ?, ?, ?, ?)`,
      args: [case_id, event_type, title, description || null, author || null]
    })

    // Update case updated_at
    await db.execute({
      sql: "UPDATE cases SET updated_at = datetime('now') WHERE id = ?",
      args: [case_id]
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error('[Case Events API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    await db.execute({
      sql: 'DELETE FROM case_events WHERE id = ?',
      args: [parseInt(id)]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Case Events API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
