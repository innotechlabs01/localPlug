// @lp/db - Database layer for LocalPlug Platform Core
// Provides: schema, repositories, client, factories, transactions, migrations, seed

export * from './schema'
export * from './repositories'
export { getDb, resetDbClient } from './client'
export { createDatabase, resetDatabase, createInstrumentedDatabase } from './factory'
export { getMetrics, logMetrics, getAllMetrics, resetMetrics } from './observe'
export type { DatabaseClient } from './factory'
export type { LibSQLDatabase } from 'drizzle-orm/libsql'
export { withTransaction, runInTransaction, withRetry, batchInsert } from './transaction'
export { seed } from './seed'
export { runMigrations } from './migrate'
export { migrations } from './migrations'
