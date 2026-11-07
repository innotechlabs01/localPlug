// @lp/communication — Handler Contract
// A Handler maps a domain event to a NotificationIntent.

import type { DomainEvent } from '@lp/events'

export type RecipientType = 'customer' | 'driver' | 'hotel' | 'admin' | 'support' | 'system'

export interface Recipient {
  readonly type: RecipientType
  readonly id: string
  readonly email?: string
  readonly phone?: string
  readonly name?: string
}

export interface NotificationIntent {
  readonly recipients: Recipient[]
  readonly templateId: string
  readonly payload: Record<string, unknown>
  readonly priority: 'low' | 'normal' | 'high' | 'urgent'
  readonly overridePreferences?: boolean
  readonly channels?: string[]
}

export interface CommunicationHandler {
  readonly eventType: string

  handle(event: DomainEvent): Promise<NotificationIntent | null>
}
