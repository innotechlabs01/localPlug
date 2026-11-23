import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const ALLOWED_TASK_COLUMNS = ['title', 'assignee', 'status', 'due_date', 'case_id']

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { case_id, title, assignee, status, due_date } = body

    if (!case_id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getDb()
    const result = await db.execute({
      sql: `INSERT INTO case_tasks (case_id, title, assignee, status, due_date)
            VALUES (?, ?, ?, ?, ?)`,
      args: [case_id, title, assignee || null, status || 'pending', due_date || null]
    })

    // Update case updated_at
    await db.execute({
      sql: "UPDATE cases SET updated_at = datetime('now') WHERE id = ?",
      args: [case_id]
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) })
  } catch (error) {
    console.error('[Case Tasks API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, status, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    let { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_TASK_COLUMNS)

    if (status) {
      setClauses.push('status = ?')
      args.push(status)
    }

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    setClauses.push("updated_at = datetime('now')")
    args.push(id)

    await db.execute({
      sql: `UPDATE case_tasks SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Case Tasks API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
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
      sql: 'DELETE FROM case_tasks WHERE id = ?',
      args: [parseInt(id)]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Case Tasks API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
