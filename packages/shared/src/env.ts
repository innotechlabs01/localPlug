// Safe environment accessor primitive. Reads from process.env; never throws.
// Structured configuration lives in the config domain (packages/config) — this is a raw primitive.
export function getEnv(name: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined
  return process.env[name]
}

export function getEnvOr(name: string, fallback: string): string {
  return getEnv(name) ?? fallback
}

export function requireEnv(name: string): string {
  const value = getEnv(name)
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}
