import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { case_id, file_name, file_size, file_type, file_url, uploaded_by } = body

    if (!case_id || !file_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `INSERT INTO case_documents (case_id, file_name, file_size, file_type, file_url, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [case_id, file_name, file_size || null, file_type || null, file_url || null, uploaded_by || null]
    })

    // Update case updated_at
    await db.execute({
      sql: "UPDATE cases SET updated_at = datetime('now') WHERE id = ?",
      args: [case_id]
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error('[Case Documents API] POST error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
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
      sql: 'DELETE FROM case_documents WHERE id = ?',
      args: [parseInt(id)]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Case Documents API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
