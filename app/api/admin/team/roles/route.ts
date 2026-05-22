import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  try {
    const result = await db.execute('SELECT id, name, description FROM roles ORDER BY name')
    return NextResponse.json({ roles: result.rows })
  } catch {
    // Fallback roles if table doesn't exist
    return NextResponse.json({
      roles: [
        { id: 1, name: 'admin', description: 'Administrator' },
        { id: 2, name: 'manager', description: 'Manager' },
        { id: 3, name: 'concierge', description: 'Concierge' },
        { id: 4, name: 'viewer', description: 'Viewer' },
      ]
    })
  }
}
