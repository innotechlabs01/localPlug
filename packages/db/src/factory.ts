// Unified Database Factory — single decision point for DB client selection.
//
// Architecture:
//   createDatabase()
//       │
//       ├── use-drizzle OFF → LegacyClient (@libsql/client raw)
//       └── use-drizzle ON  → DrizzleClient (Drizzle ORM + legacy .execute() compat)
//
// Both paths share the same underlying Turso/LibSQL connection.
// Both paths expose .execute({sql, args}), .batch(), .close() for backward compat.
// When use-drizzle ON, DrizzleClient also exposes .select()/.insert()/.update()/.delete()
// for domain repositories.
//
// NO consumer should check the feature flag directly.
// All consumers call createDatabase() and get the appropriate client.

import { isFlagEnabled } from '@lp/config'
import { createClient } from '@libsql/client'
import type { Client as LibSQLClient, InStatement, ResultSet } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'
import { recordRequest } from './observe'

const DB_CONCURRENCY = parseInt(process.env.DB_CONCURRENCY || '16', 10)

// ---------------------------------------------------------------------------
// Common interface — satisfied by both Legacy and Drizzle clients
// ---------------------------------------------------------------------------

export interface DatabaseClient {
  execute(stmt: InStatement): Promise<ResultSet>
  batch(stmts: InStatement[]): Promise<ResultSet[]>
  close(): void | Promise<void>
}

// ---------------------------------------------------------------------------
// Shared client creation
// ---------------------------------------------------------------------------

function createRawClient(): LibSQLClient {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_API_KEY
  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_API_KEY must be configured')
  }
  return createClient({ url, authToken, concurrency: DB_CONCURRENCY })
}

// ---------------------------------------------------------------------------
// Legacy path — raw @libsql/client (zero behavior change)
// ---------------------------------------------------------------------------

function createLegacyClient(): LibSQLClient {
  return createRawClient()
}

// ---------------------------------------------------------------------------
// Drizzle path — Drizzle ORM with backward-compatible interface
// ---------------------------------------------------------------------------

function createDrizzleClient(): LibSQLClient & { drizzle: LibSQLDatabase<typeof schema> } {
  const rawClient = createRawClient()
  const drizzleDb = drizzle(rawClient, { schema, logger: process.env.NODE_ENV === 'development' })

  // Expose the raw client (has .execute(), .batch(), .close()) AND the Drizzle
  // instance (has .select(), .insert(), .update(), .delete(), .transaction()).
  //
  // Legacy consumers use rawClient methods — no behavior change.
  // Drizzle consumers (repos) use the .drizzle property — typed access to ORM.
  //
  // The raw client IS the Drizzle connection underneath — they share the same
  // Turso/LibSQL connection pool.

  return Object.assign(rawClient, { drizzle: drizzleDb })
}

// ---------------------------------------------------------------------------
// Factory — single decision point
// ---------------------------------------------------------------------------

let _client: DatabaseClient | null = null

export function createDatabase(): DatabaseClient {
  if (_client) return _client

  if (isFlagEnabled('use-drizzle')) {
    _client = createDrizzleClient()
  } else {
    _client = createLegacyClient()
  }

  return _client
}

// Access the Drizzle instance when use-drizzle=ON.
// Throws if flag is OFF (Drizzle not initialized).
export function getDrizzleDb(): LibSQLDatabase<typeof schema> {
  const client = createDatabase()
  if ('drizzle' in client) {
    return (client as ReturnType<typeof createDrizzleClient>).drizzle
  }
  throw new Error('Drizzle client not available — use-drizzle flag is OFF')
}

export function resetDatabase(): void {
  _client = null
}

// ---------------------------------------------------------------------------
// Instrumented wrapper — adds observability metrics around .execute()
// Remove after Drizzle migration is complete and legacy path is retired.
// ---------------------------------------------------------------------------

export function createInstrumentedDatabase(): DatabaseClient {
  const inner = createDatabase()
  const label = isFlagEnabled('use-drizzle') ? 'Drizzle' : 'Legacy'

  return {
    execute: async (stmt: InStatement): Promise<ResultSet> => {
      const start = Date.now()
      let isError = false
      try {
        return await inner.execute(stmt)
      } catch (err) {
        isError = true
        throw err
      } finally {
        recordRequest(label, Date.now() - start, isError)
      }
    },
    batch: async (stmts: InStatement[]): Promise<ResultSet[]> => {
      const start = Date.now()
      let isError = false
      try {
        return await inner.batch(stmts)
      } catch (err) {
        isError = true
        throw err
      } finally {
        recordRequest(label, Date.now() - start, isError)
      }
    },
    close: () => inner.close() as void | Promise<void>,
  }
}
