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
