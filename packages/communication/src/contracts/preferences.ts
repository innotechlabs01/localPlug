// @lp/communication — Preferences Contract
// Resolves user notification preferences and quiet hours.

import type { Channel } from './provider'
import type { Recipient } from './handler'

export interface NotificationPreferences {
  readonly recipientId: string
  readonly channels: Record<Channel, boolean>
  readonly quietHoursStart?: string
  readonly quietHoursEnd?: string
  readonly timezone?: string
}

export interface PreferenceResolver {
  resolve(recipient: Recipient): Promise<NotificationPreferences>

  isQuietHours(preferences: NotificationPreferences): boolean
}
