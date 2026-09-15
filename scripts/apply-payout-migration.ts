import { createClient } from '@libsql/client'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { config } from 'dotenv'

config({ path: join(__dirname, '..', '.env.local') })

async function main() {
  const files = ['040_payout_ledger.sql', '041_payout_ledger_unique.sql', '042_events_outbox.sql', '043_payout_request_unique_active.sql']
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_API_KEY!,
  })

  for (const file of files) {
    const content = await readFile(join(__dirname, '..', 'lib', 'db', 'migrations', file), 'utf-8')
    const cleaned = content.split('\n').map(l => {
      const i = l.indexOf('--')
      return i >= 0 ? l.substring(0, i) : l
    }).join('\n')
    const statements = cleaned.split(';').map(s => s.trim()).filter(Boolean)

    console.log(`\n== ${file} ==`)
    for (const stmt of statements) {
      try {
        await db.execute(stmt)
        console.log('✓', stmt.replace(/\s+/g, ' ').slice(0, 80))
      } catch (err: any) {
        const msg = err.message || ''
        if (msg.includes('already exists') || msg.includes('duplicate column') || msg.includes('duplicate name')) {
          console.log('⏭ (idempotent skip)', msg.slice(0, 60))
        } else {
          console.error('✗', stmt.slice(0, 80), '\n  ', msg)
        }
      }
    }
  }

  const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('vehicle_categories','payout_ledger','payout_requests','refunds_disputes')`)
  console.log('\nTables present:', tables.rows.map(r => r.name).join(', ') || 'NONE')
  const idx = await db.execute(`SELECT name FROM sqlite_master WHERE type='index' AND name='idx_payout_ledger_unique'`)
  console.log('unique index:', idx.rows.length ? 'present' : 'MISSING')
  await db.close()
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1) })