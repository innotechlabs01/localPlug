// Database client — delegates to factory for dual-path switching.
// This file maintains backward compatibility for internal consumers
// (transaction.ts, migrate.ts, repositories) that import from './client'.

import { createDatabase, resetDatabase } from './factory'

export { createDatabase, resetDatabase }
export type { DatabaseClient } from './factory'

// Canonical accessor — returns the appropriate client based on use-drizzle flag.
// When flag OFF: returns raw @libsql/client Client (legacy behavior).
// When flag ON: returns Drizzle LibSQLDatabase with .execute() compat wrapper.
//
// Typed as `any` during transition. After B8 completes and all consumers are
// Drizzle-native, this narrows to LibSQLDatabase<typeof schema>.
export function getDb(): any {
  return createDatabase()
}

export function resetDbClient(): void {
  resetDatabase()
}

export { createClient } from '@libsql/client'
export type { LibSQLDatabase } from 'drizzle-orm/libsql'
