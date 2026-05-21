import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

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
  // Map doc_type to DB column
  const column = doc_type === 'other' ? null : `${doc_type}_expiry`
  if (column) {
    await db.execute({
      sql: `UPDATE drivers SET ${column} = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [expiry_date || doc_url, id],
    })
  }

  return NextResponse.json({ success: true })
}
