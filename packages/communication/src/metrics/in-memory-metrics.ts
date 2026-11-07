// @lp/communication — In-Memory Metrics
// For testing and development.

import type { CommunicationMetrics } from '../contracts/metrics'
import type { Channel } from '../contracts/provider'

export class InMemoryMetrics implements CommunicationMetrics {
  private sent = new Map<string, number>()
  private delivered = new Map<string, number>()
  private failed = new Map<string, number>()
  private latency = new Map<string, number[]>()
  private cost = new Map<string, number>()

  private key(channel: Channel, suffix: string): string {
    return `${channel}:${suffix}`
  }

  recordSent(channel: Channel, eventType: string): void {
    const key = this.key(channel, 'sent')
    this.sent.set(key, (this.sent.get(key) || 0) + 1)
  }

  recordDelivered(channel: Channel, eventType: string): void {
    const key = this.key(channel, 'delivered')
    this.delivered.set(key, (this.delivered.get(key) || 0) + 1)
  }

  recordFailed(channel: Channel, eventType: string, error: string): void {
    const key = this.key(channel, 'failed')
    this.failed.set(key, (this.failed.get(key) || 0) + 1)
  }

  recordLatency(channel: Channel, eventType: string, ms: number): void {
    const key = this.key(channel, 'latency')
    const existing = this.latency.get(key) || []
    existing.push(ms)
    this.latency.set(key, existing)
  }

  recordCost(channel: Channel, cents: number): void {
    const key = this.key(channel, 'cost')
    this.cost.set(key, (this.cost.get(key) || 0) + cents)
  }

  getSentCount(channel?: Channel): number {
    if (channel) {
      return this.sent.get(this.key(channel, 'sent')) || 0
    }
    let total = 0
    for (const v of this.sent.values()) total += v
    return total
  }

  getDeliveredCount(channel?: Channel): number {
    if (channel) {
      return this.delivered.get(this.key(channel, 'delivered')) || 0
    }
    let total = 0
    for (const v of this.delivered.values()) total += v
    return total
  }

  getFailedCount(channel?: Channel): number {
    if (channel) {
      return this.failed.get(this.key(channel, 'failed')) || 0
    }
    let total = 0
    for (const v of this.failed.values()) total += v
    return total
  }

  getAvgLatency(channel?: Channel): number {
    if (channel) {
      const values = this.latency.get(this.key(channel, 'latency')) || []
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
    }
    let total = 0
    let count = 0
    for (const values of this.latency.values()) {
      total += values.reduce((a, b) => a + b, 0)
      count += values.length
    }
    return count ? total / count : 0
  }
}
