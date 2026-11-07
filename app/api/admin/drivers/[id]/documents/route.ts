import { NextResponse } from 'next/server'
import { getDb, buildSafeUpdate } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const ALLOWED_DRIVER_DOC_COLUMNS = ['license_expiry', 'soat_expiry', 'tech_inspection_expiry', 'insurance_expiry']

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { doc_type, doc_url, expiry_date } = body

  if (!doc_type || !doc_url) {
    return NextResponse.json({ error: 'doc_type and doc_url required' }, { status: 400 })
  }

  const validTypes = ['license', 'soat', 'tech_inspection', 'insurance', 'other']
  if (!validTypes.includes(doc_type)) {
    return NextResponse.json({ error: `Invalid doc_type. Must be: ${validTypes.join(', ')}` }, { status: 400 })
  }

  const db = getDb()
  const updates: Record<string, unknown> = {}
  if (doc_type !== 'other') {
    updates[`${doc_type}_expiry`] = expiry_date || doc_url
  }
  const { setClauses, args } = buildSafeUpdate(updates, ALLOWED_DRIVER_DOC_COLUMNS)
  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  setClauses.push("updated_at = datetime('now')")
  args.push(id)

  await db.execute({
    sql: `UPDATE drivers SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  })

  return NextResponse.json({ success: true })
}
