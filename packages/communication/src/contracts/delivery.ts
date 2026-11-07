// @lp/communication — Delivery Contract
// Tracks delivery state machine and persistence.

import type { Channel, DeliveryStatus } from './provider'

export interface DeliveryRecord {
  readonly id: string
  readonly notificationId: string
  readonly channel: Channel
  readonly recipient: string
  readonly status: DeliveryStatus
  readonly provider: string
  readonly messageId?: string
  readonly error?: string
  readonly attempts: number
  readonly lastAttemptAt?: Date
  readonly deliveredAt?: Date
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface DeliveryTracker {
  recordAttempt(input: {
    notificationId: string
    channel: Channel
    recipient: string
    status: DeliveryStatus
    provider: string
    messageId?: string
    error?: string
  }): Promise<DeliveryRecord>

  updateStatus(
    deliveryId: string,
    status: DeliveryStatus,
    error?: string
  ): Promise<DeliveryRecord>

  findByNotification(notificationId: string): Promise<DeliveryRecord[]>
  findByStatus(status: DeliveryStatus): Promise<DeliveryRecord[]>
}
