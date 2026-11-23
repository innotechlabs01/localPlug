import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requirePermission } from '@/lib/admin/permissions'

export async function GET(req: Request) {
  const authError = await requirePermission('settings', 'view')
  if (authError) return authError

  try {
    const db = getDb()
    const settingsRes = await db.execute('SELECT key, value FROM settings')
    
    // Convert array of rows to object
    const settingsObj: Record<string, string> = {}
    settingsRes.rows.forEach((row: any) => {
      settingsObj[row.key] = row.value
    })
    
    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const authError = await requirePermission('settings', 'update')
  if (authError) return authError

  try {
    const settingsData = await req.json()
    const db = getDb()
    
    // Update each setting in the database
    for (const [key, value] of Object.entries(settingsData)) {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))',
        args: [key, String(value)]
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}