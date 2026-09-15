// Database client — delegates to @lp/db factory for dual-path switching.
// All consumers should import getDb() from here.
//
// When use-drizzle=OFF: returns raw @libsql/client (legacy behavior, zero change).
// When use-drizzle=ON: returns raw @libsql/client + .drizzle property (Drizzle ORM).
//
// Business utilities (buildSafeUpdate, executeWithRetry, etc.) remain here
// because they are application-level, not infrastructure.

import { createDatabase, type DatabaseClient } from '@lp/db/factory'

let _client: DatabaseClient | null = null
let _ready: Promise<void> | null = null

const DB_BUSY_RETRY_MAX = 3
const DB_BUSY_RETRY_BASE_MS = 100

/**
 * Idempotent schema-ensure promise for the payout/realtime tables.
 * Called lazily when the client is first created; gated so the very first
 * `execute`/`batch` never races the DDL on a cold DB.
 */
function ensureReady(raw: DatabaseClient): Promise<void> {
  if (!_ready) {
    _ready = (async () => {
      const { ensureRuntimeSchema } = await import('./db/ensure-runtime')
      await ensureRuntimeSchema(raw)
    })().catch(err => {
      console.error('[runtime-schema] ensure failed:', err)
    })
  }
  return _ready
}

/** Await schema readiness (idempotent; resolved after the first ensure). */
export function dbReady(): Promise<void> {
  if (!_client) throw new Error('dbReady() called before getDb()')
  return _ready || Promise.resolve()
}

export function getDb(): DatabaseClient {
  if (!_client) {
    const raw = createDatabase()
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      import('@lp/config').then(({ validateEnv }) => validateEnv()).catch(() => {})
      ensureReady(raw)
    }
    // Gate execute/batch behind the ensure so a cold DB never 500s on the first
    // query (the schema DDL runs before any business statement).
    _client = new Proxy(raw, {
      get(target, prop, receiver) {
        if (prop === 'execute' || prop === 'batch' || prop === 'close') {
          const method = (target as unknown as Record<string, (...a: unknown[]) => unknown>)[prop as string]
          if (typeof method !== 'function') return undefined
          return async (...args: unknown[]): Promise<unknown> => {
            await (_ready || Promise.resolve())
            return (method as (...a: unknown[]) => Promise<unknown>).apply(target, args)
          }
        }
        const value = Reflect.get(target, prop, receiver)
        return typeof value === 'function' ? value.bind(target) : value
      },
    }) as unknown as DatabaseClient
  }
  return _client
}

/**
 * Safely build SET clause for UPDATE queries.
 * Only allows column names in the whitelist, preventing SQL injection via column names.
 */
export function buildSafeUpdate(
  updates: Record<string, unknown>,
  allowedColumns: string[],
): { setClauses: string[]; args: (string | number | boolean | null)[] } {
  const setClauses: string[] = []
  const args: (string | number | boolean | null)[] = []

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id' && allowedColumns.includes(key)) {
      setClauses.push(`${key} = ?`)
      args.push(value as string | number | boolean | null)
    }
  }

  return { setClauses, args }
}

function isBusyError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return msg.includes('busy') || msg.includes('locked') || msg.includes('database is locked')
  }
  return false
}

export async function executeWithRetry(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[],
  retries: number = DB_BUSY_RETRY_MAX,
): Promise<{ rows: Array<Record<string, unknown>>; rowsAffected: number; columns: string[] }> {
  const db = getDb()
  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await db.execute({ sql, args: args || [] })
    } catch (err) {
      lastErr = err
      if (!isBusyError(err) || attempt >= retries) throw err
      const delay = DB_BUSY_RETRY_BASE_MS * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastErr
}

export async function incrementPromotionUsage(code: string): Promise<boolean> {
  const result = await executeWithRetry(
    `UPDATE promotions
     SET usage_count = usage_count + 1, updated_at = datetime('now')
     WHERE code = ? AND is_active = 1
       AND (usage_limit IS NULL OR usage_count < usage_limit)
       AND (starts_at IS NULL OR starts_at <= datetime('now'))
       AND (ends_at IS NULL OR ends_at >= datetime('now'))`,
    [code.toUpperCase()],
  )
  return result.rowsAffected > 0
}
