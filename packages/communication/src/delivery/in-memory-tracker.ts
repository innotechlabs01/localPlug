// @lp/communication — In-Memory Delivery Tracker
// For testing and development.

import type { DeliveryTracker, DeliveryRecord } from '../contracts/delivery'
import type { Channel, DeliveryStatus } from '../contracts/provider'

export class InMemoryDeliveryTracker implements DeliveryTracker {
  private records: DeliveryRecord[] = []
  private counter = 0

  async recordAttempt(input: {
    notificationId: string
    channel: Channel
    recipient: string
    status: DeliveryStatus
    provider: string
    messageId?: string
    error?: string
  }): Promise<DeliveryRecord> {
    const now = new Date()
    const record: DeliveryRecord = {
      id: `del_${++this.counter}`,
      notificationId: input.notificationId,
      channel: input.channel,
      recipient: input.recipient,
      status: input.status,
      provider: input.provider,
      messageId: input.messageId,
      error: input.error,
      attempts: 1,
      lastAttemptAt: now,
      deliveredAt: input.status === 'delivered' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    }
    this.records.push(record)
    return record
  }

  async updateStatus(
    deliveryId: string,
    status: DeliveryStatus,
    error?: string
  ): Promise<DeliveryRecord> {
    const record = this.records.find(r => r.id === deliveryId)
    if (!record) throw new Error(`Delivery ${deliveryId} not found`)

    const updated: DeliveryRecord = {
      ...record,
      status,
      error: error || record.error,
      deliveredAt: status === 'delivered' ? new Date() : record.deliveredAt,
      updatedAt: new Date(),
    }

    const index = this.records.findIndex(r => r.id === deliveryId)
    this.records[index] = updated
    return updated
  }

  async findByNotification(notificationId: string): Promise<DeliveryRecord[]> {
    return this.records.filter(r => r.notificationId === notificationId)
  }

  async findByStatus(status: DeliveryStatus): Promise<DeliveryRecord[]> {
    return this.records.filter(r => r.status === status)
  }
}
