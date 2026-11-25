import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { readFile } from 'fs/promises'
import { join } from 'path'

config({ path: join(__dirname, '..', '.env.local') })

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_API_KEY
  if (!url || !authToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_API_KEY')
    process.exit(1)
  }
  const db = createClient({ url, authToken })
  const sql = await readFile(join(__dirname, '..', 'lib', 'db', 'migrations', '046_hotel_audit_log.sql'), 'utf-8')
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0)
  for (const stmt of statements) {
    try {
      await db.execute(stmt)
      console.log('OK:', stmt.substring(0, 60))
    } catch (e: any) {
      console.log('SKIP:', e.message)
    }
  }
  await db.close()
  console.log('Migration 046 applied')
}

main()
