import { createClient } from '@libsql/client'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { config } from 'dotenv'

config({ path: join(__dirname, '..', '.env.local') })

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_API_KEY

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_API_KEY')
  process.exit(1)
}

const db = createClient({ url, authToken })
const MIGRATIONS_DIR = join(__dirname, '..', 'lib', 'db', 'migrations')

async function getMigrationFiles(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR)
  return files
    .filter(f => f.endsWith('.sql'))
    .sort()
}

async function applyMigration(filePath: string): Promise<boolean> {
  const content = await readFile(filePath, 'utf-8')

  // Strip single-line comments (-- ...) but keep the SQL
  const cleaned = content
    .split('\n')
    .map(line => {
      // Remove inline comments but preserve the SQL part
      const commentIdx = line.indexOf('--')
      if (commentIdx >= 0) return line.substring(0, commentIdx)
      return line
    })
    .join('\n')

  // Split by semicolons and filter out empty statements
  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await db.execute(stmt)
    } catch (err: any) {
      // Ignore idempotent migration errors
      const msg = err.message || ''
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate column') ||
        msg.includes('duplicate name')
      ) {
        continue
      }
      throw err
    }
  }
  return true
}

async function ensureMigrationsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

async function getAppliedMigrations(): Promise<Set<string>> {
  await ensureMigrationsTable()
  const res = await db.execute('SELECT filename FROM _migrations')
  return new Set(res.rows.map(r => String(r.filename)))
}

async function main() {
  const args = process.argv.slice(2)
  const mode = args.find(a => !a.startsWith('--')) || 'apply'
  const fromArg = args.find(a => a.startsWith('--from='))?.split('=')[1]
  const onlyArg = args.find(a => a.startsWith('--only='))?.split('=')[1]
  const toArg = args.find(a => a.startsWith('--to='))?.split('=')[1]

  if (mode === 'status') {
    const [files, applied] = await Promise.all([getMigrationFiles(), getAppliedMigrations()])
    console.log('Migrations status:')
    for (const f of files) {
      console.log(`  [${applied.has(f) ? '✓' : ' '}] ${f}`)
    }
    await db.close()
    return
  }

  if (mode === 'baseline') {
    const files = await getMigrationFiles()
    await ensureMigrationsTable()
    let count = 0
    for (const f of files) {
      if (toArg && f.localeCompare(toArg) > 0 && !f.startsWith(toArg)) continue
      await db.execute({ sql: 'INSERT OR IGNORE INTO _migrations (filename) VALUES (?)', args: [f] })
      count++
    }
    console.log(`✓ Marked ${count} migrations as baseline in _migrations`)
    await db.close()
    return
  }

  if (mode === 'clear-drivers') {
    // Clear all drivers (for fresh start)
    console.log('Clearing all drivers...')
    await db.execute('DELETE FROM drivers')
    const result = await db.execute('SELECT COUNT(*) as count FROM drivers')
    console.log(`Drivers after clear: ${result.rows[0].count}`)
    await db.close()
    return
  }

  if (mode === 'reset-orders') {
    // Reset all order dispatch statuses
    console.log('Resetting order dispatch statuses...')
    await db.execute("UPDATE orders SET assigned_to = NULL, dispatch_status = 'pending', assigned_at = NULL")
    console.log('Orders reset to pending')
    await db.close()
    return
  }

  if (mode === 'clean-for-testing') {
    console.log('🧹 Cleaning database for testing (preserving drivers & reference data)...\n')

    // Tables to DELETE all rows from (transactional/generated data)
    const tablesToClean = [
      'orders',
      'payments',
      'order_status_history',
      'order_comments',
      'conversations',
      'messages',
      'chat_sessions',
      'whatsapp_events',
      'customers',
      'cases',
      'case_events',
      'case_documents',
      'case_tasks',
      'employee_activity',
    ]

    for (const table of tablesToClean) {
      try {
        await db.execute(`DELETE FROM ${table}`)
        console.log(`  ✓ ${table} cleaned`)
      } catch (err: any) {
        const msg = err.message || ''
        if (msg.includes('no such table')) {
          console.log(`  ⏭ ${table} (table does not exist, skipping)`)
        } else {
          console.error(`  ✗ ${table} FAILED: ${msg}`)
        }
      }
    }

    // Reset sqlite_sequence for cleaned tables
    try {
      await db.execute("DELETE FROM sqlite_sequence WHERE name IN ('orders','payments','order_status_history','conversations','messages','chat_sessions','whatsapp_events','customers','cases','case_events','case_documents','case_tasks')")
      console.log('  ✓ autoincrement counters reset')
    } catch {
      // sqlite_sequence might not exist
    }

    console.log('\n✅ Database cleaned! Preserved: drivers, users, roles, lookup tables')
    await db.close()
    return
  }

  // Default: apply only pending migrations (unless --only or --from is specified)
  const [files, applied] = await Promise.all([getMigrationFiles(), getAppliedMigrations()])
  const pending = files.filter(f => {
    if (onlyArg) return f.startsWith(onlyArg) || f === onlyArg
    if (applied.has(f)) return false
    if (fromArg && f < fromArg) return false
    return true
  })

  console.log(`Found ${files.length} migrations (${applied.size} already applied, ${pending.length} pending)`)

  for (const file of pending) {
    console.log(`Applying ${file}...`)
    await applyMigration(join(MIGRATIONS_DIR, file))
    await db.execute({ sql: 'INSERT OR IGNORE INTO _migrations (filename) VALUES (?)', args: [file] })
    console.log(`✓ ${file}`)
  }

  // Verify tables exist
  const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
  console.log('\nTables in database:')
  for (const row of tables.rows) {
    console.log(`  ${row.name}`)
  }

  await db.close()
  console.log('\nAll migrations applied successfully')
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
