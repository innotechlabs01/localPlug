import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const ALLOWED_CASE_COLUMNS = [
  'title', 'description', 'type', 'status', 'priority',
  'assigned_to', 'customer_id', 'internal_notes',
]

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = getDb()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      // Get single case with all related data
      const caseResult = await db.execute({
        sql: 'SELECT * FROM cases WHERE id = ?',
        args: [parseInt(id)]
      })
      if (caseResult.rows.length === 0) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      const caseData = caseResult.rows[0]

      const events = await db.execute({
        sql: 'SELECT * FROM case_events WHERE case_id = ? ORDER BY created_at DESC',
        args: [parseInt(id)]
      })

      const documents = await db.execute({
        sql: 'SELECT * FROM case_documents WHERE case_id = ? ORDER BY created_at DESC',
        args: [parseInt(id)]
      })

      const tasks = await db.execute({
        sql: 'SELECT * FROM case_tasks WHERE case_id = ? ORDER BY due_date ASC',
        args: [parseInt(id)]
      })

      return NextResponse.json({
        case: caseData,
        events: events.rows,
        documents: documents.rows,
        tasks: tasks.rows,
      })
    }

    // Get all cases
    const result = await db.execute(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM case_events WHERE case_id = c.id) as event_count,
        (SELECT COUNT(*) FROM case_documents WHERE case_id = c.id) as document_count,
        (SELECT COUNT(*) FROM case_tasks WHERE case_id = c.id AND status != 'completed') as pending_tasks
      FROM cases c
      ORDER BY c.updated_at DESC
    `)

    return NextResponse.json({ cases: result.rows })
  } catch (error) {
    console.error('[Cases API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { client_name, case_type, case_category, court_name, description } = body

    if (!client_name || !case_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getDb()
    const caseNumber = `CASE-${Date.now()}`
    const initials = client_name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()

    const result = await db.execute({
      sql: `INSERT INTO cases (case_number, client_name, client_initials, case_type, case_category, court_name, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
      args: [caseNumber, client_name, initials, case_type, case_category || 'laboral', court_name || null, description || null]
    })

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid), caseNumber })
  } catch (error) {
    console.error('[Cases API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getDb()
    const { setClauses, args } = buildSafeUpdate(updates as Record<string, unknown>, ALLOWED_CASE_COLUMNS)

    if (updates.status) {
      setClauses.push('status = ?')
      args.push(updates.status as string)
      if (updates.status === 'closed') setClauses.push("closed_at = datetime('now')")
    }

    if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    setClauses.push("updated_at = datetime('now')")
    args.push(id)

    await db.execute({
      sql: `UPDATE cases SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cases API] PUT error:', error)
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
  }
}
