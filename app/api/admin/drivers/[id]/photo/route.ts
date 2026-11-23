import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { photo_url } = body

  if (!photo_url) {
    return NextResponse.json({ error: 'photo_url required' }, { status: 400 })
  }

  const db = getDb()
  await db.execute({
    sql: "UPDATE drivers SET photo_url = ?, updated_at = datetime('now') WHERE id = ?",
    args: [photo_url, id],
  })

  return NextResponse.json({ success: true })
}
