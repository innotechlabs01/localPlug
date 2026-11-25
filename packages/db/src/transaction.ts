import { getDb } from './client'
import { eq, and, or, like, ilike, desc, asc, sql, inArray, gte, lte, count } from 'drizzle-orm'

// Transaction helper supporting both Drizzle ORM and raw @libsql/client
export async function withTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  const db = getDb() as any
  if (db.drizzle && typeof db.drizzle.transaction === 'function') {
    return db.drizzle.transaction(fn)
  }
  const tx = await db.transaction('write')
  try {
    const result = await fn(tx)
    await tx.commit()
    return result
  } catch (err) {
    await tx.rollback().catch(() => {})
    throw err
  }
}

export async function runInTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  return withTransaction(callback)
}

// Helper for batch operations
export async function batchInsert<T>(items: T[], batchSize = 100): Promise<void> {
  if (items.length === 0) return
  console.log(`[Batch] Would insert ${items.length} items in batches of ${batchSize}`)
}

// Retry logic for transient errors
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
