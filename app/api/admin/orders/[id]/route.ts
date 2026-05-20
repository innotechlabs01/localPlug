import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()

  const result = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json(result.rows[0])
}
