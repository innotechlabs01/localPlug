import { getDb } from './client'
import { migrate } from 'drizzle-orm/libsql/migrator'

export async function runMigrations(): Promise<void> {
  const db = getDb()
  await migrate(db, { migrationsFolder: './packages/db/src/migrations' })
  console.log('[Migrations] Applied successfully')
}