'use client'

import { InactivityGuard as SharedInactivityGuard } from '@/components/shared/InactivityGuard'

export function InactivityGuard() {
  return <SharedInactivityGuard signOutRedirectUrl="/sign-in/admin" />
}
