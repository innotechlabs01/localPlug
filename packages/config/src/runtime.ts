// Runtime environment helpers. Reads NODE_ENV only — no project imports.

export type NodeEnv = 'development' | 'production' | 'test' | 'staging'

function getNodeEnv(): string {
  if (typeof process === 'undefined' || !process.env) return 'development'
  const env: string = process.env.NODE_ENV ?? 'development'
  if (env === 'production' || env === 'test' || env === 'staging') return env
  return 'development'
}

export const NODE_ENV = getNodeEnv()

export function isProd(): boolean { return NODE_ENV === 'production' }
export function isDev(): boolean { return NODE_ENV === 'development' }
export function isStaging(): boolean { return NODE_ENV === 'staging' }
export function isTest(): boolean { return NODE_ENV === 'test' }