// Epic 2C.0 — Migration Workspace: feature-flag registry (boot flags, all DEFAULT OFF).
//
// SAFE: nothing reads these flags yet. High-Risk steps flip their flag ON in staging only after
// the step's gate + rollback are proven (see blueprint/MIGRATION_WORKSPACE.md + IMPLEMENTATION_RULES).
// Rollback = flip the flag OFF. This module is the seed of the flag registry (formalized in B24).

export type FeatureFlag =
  | 'use-drizzle'
  | 'use-domain-auth'
  | 'use-domain-booking'
  | 'use-domain-payments'
  | 'use-domain-notifications'
  | 'use-domain-dispatch'
  | 'use-socketio'

export type FlagRisk = 'Low' | 'Med' | 'High'

export const FEATURE_FLAGS: Record<FeatureFlag, { description: string; risk: FlagRisk }> = {
  'use-drizzle': { description: 'Use Drizzle client instead of legacy db client (B4)', risk: 'High' },
  'use-domain-auth': { description: 'Use domain auth persistence (B5B)', risk: 'High' },
  'use-domain-booking': { description: 'Route booking through domains/booking (B13)', risk: 'High' },
  'use-domain-payments': { description: 'Route payments through domains/payments (B19)', risk: 'High' },
  'use-domain-notifications': {
    description: 'Route notifications through domains/notifications (B11)',
    risk: 'High',
  },
  'use-domain-dispatch': { description: 'Route dispatch through domains/dispatch (B14)', risk: 'High' },
  'use-socketio': { description: 'Use Socket.IO instead of polling (B23)', risk: 'High' },
}

const FLAG_ENV_PREFIX = 'LP_FLAG_'

function envName(flag: FeatureFlag): string {
  return FLAG_ENV_PREFIX + flag.toUpperCase().replace(/-/g, '_')
}

/** Returns false unless explicitly enabled via env (server). Default OFF by design. */
export function isFlagEnabled(flag: FeatureFlag): boolean {
  if (typeof process === 'undefined' || !process.env) return false
  const v = process.env[envName(flag)]
  return v === 'true' || v === '1'
}

export function listFlags(): FeatureFlag[] {
  return Object.keys(FEATURE_FLAGS) as FeatureFlag[]
}

export function flagRisk(flag: FeatureFlag): FlagRisk {
  return FEATURE_FLAGS[flag].risk
}
