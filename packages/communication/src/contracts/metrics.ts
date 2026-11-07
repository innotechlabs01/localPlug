// @lp/communication — Metrics Contract
// Observability, cost tracking, alerting.

import type { Channel } from './provider'

export interface CommunicationMetrics {
  recordSent(channel: Channel, eventType: string): void
  recordDelivered(channel: Channel, eventType: string): void
  recordFailed(channel: Channel, eventType: string, error: string): void
  recordLatency(channel: Channel, eventType: string, ms: number): void
  recordCost(channel: Channel, cents: number): void

  getSentCount(channel?: Channel): number
  getDeliveredCount(channel?: Channel): number
  getFailedCount(channel?: Channel): number
  getAvgLatency(channel?: Channel): number
}
