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
