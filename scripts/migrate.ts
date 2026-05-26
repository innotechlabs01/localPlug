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

async function main() {
  const mode = process.argv[2] || 'apply'

  if (mode === 'status') {
    // Show available migrations
    const files = await getMigrationFiles()
    console.log('Available migrations:')
    for (const f of files) {
      console.log(`  ${f}`)
    }
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

  // Default: apply all migrations
  const files = await getMigrationFiles()
  console.log(`Found ${files.length} migrations`)

  for (const file of files) {
    console.log(`Applying ${file}...`)
    await applyMigration(join(MIGRATIONS_DIR, file))
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
