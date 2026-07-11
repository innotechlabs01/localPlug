// Typed environment-variable access. Reads from process.env only.
// This module is the runtime configuration boundary: it imports NOTHING from the
// project (no DB, no domains, no clients). Server/client safe.

export interface KnownEnv {
  NODE_ENV?: string
  TURSO_DATABASE_URL?: string
  TURSO_API_KEY?: string
  CLERK_SECRET_KEY?: string
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string
  N8N_BASE_URL?: string
  N8N_API_KEY?: string
  N8N_WEBHOOK_SECRET?: string
  PADDLE_API_KEY?: string
  PADDLE_WEBHOOK_SECRET?: string
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?: string
  PADDLE_PRODUCT_ID?: string
  PADDLE_PRO_PRODUCT_ID?: string
  EVOLUTION_API_URL?: string
  EVOLUTION_API_KEY?: string
  EVOLUTION_WEBHOOK_SECRET?: string
  OPENAI_API_KEY?: string
}

export function getEnvVar(name: keyof KnownEnv | string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined
  const value = process.env[name]
  return value === undefined || value === '' ? undefined : value
}

export function getEnvVarOr(name: keyof KnownEnv | string, fallback: string): string {
  return getEnvVar(name) ?? fallback
}

const REQUIRED_ENV_VARS: string[] = [
  'TURSO_DATABASE_URL',
  'TURSO_API_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
]

const WARN_ENV_VARS: string[] = [
  'N8N_BASE_URL',
  'N8N_API_KEY',
  'N8N_WEBHOOK_SECRET',
  'PADDLE_API_KEY',
  'PADDLE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN',
  'PADDLE_PRODUCT_ID',
  'PADDLE_PRO_PRODUCT_ID',
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
  'EVOLUTION_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
]

let _envValidated = false

export function validateEnv(): { missing: string[]; warnings: string[] } {
  if (_envValidated) return { missing: [], warnings: [] }
  _envValidated = true

  const missing = REQUIRED_ENV_VARS.filter((k) => !getEnvVar(k))
  const warnings = WARN_ENV_VARS.filter((k) => !getEnvVar(k))

  if (missing.length > 0) {
    console.error(`[Config] Missing required environment variables: ${missing.join(', ')}`)
  }
  if (warnings.length > 0) {
    console.warn(`[Config] Missing optional environment variables: ${warnings.join(', ')}`)
  }

  return { missing, warnings }
}
