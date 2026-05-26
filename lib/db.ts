import { createClient } from '@libsql/client'

let _client: ReturnType<typeof createClient> | null = null

export function getDb() {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_API_KEY
    if (!url || !authToken) {
      throw new Error('TURSO_DATABASE_URL and TURSO_API_KEY must be configured')
    }
    _client = createClient({ url, authToken })
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
