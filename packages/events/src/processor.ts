// @lp/events — Outbox Processor
// Part of B10. Polls the outbox table and dispatches events to the bus.
//
// This replaces:
// - lib/queue/message-queue.ts (SQLite retry queue)
// - lib/queue/whatsapp-worker.ts (batch processor)
// - app/api/cron/process-queue/route.ts (Vercel cron)
//
// The processor:
// 1. Polls outbox for pending events
// 2. Deserializes them into DomainEvent objects
// 3. Publishes to the EventBus
// 4. Marks as completed or retries on failure

import type { DomainEvent } from './types'
import type { EventBus } from './handler'
import type { OutboxRepository, OutboxEvent } from './outbox'

// ──────────────────────────────────────────────
// Outbox Processor
// ──────────────────────────────────────────────

export interface OutboxProcessorConfig {
  /** How often to poll (ms). Default: 1000 (1s) */
  pollIntervalMs: number
  /** Max events per poll. Default: 10 */
  batchSize: number
  /** Max retries before DLQ. Default: 5 */
  maxRetries: number
  /** Base retry delay (ms). Exponential backoff. Default: 1000 */
  baseRetryDelayMs: number
}

const DEFAULT_CONFIG: OutboxProcessorConfig = {
  pollIntervalMs: 1000,
  batchSize: 10,
  maxRetries: 5,
  baseRetryDelayMs: 1000,
}

export class OutboxProcessor {
  private config: OutboxProcessorConfig
  private intervalId: ReturnType<typeof setInterval> | null = null
  private running = false
  private metrics = {
    processed: 0,
    failed: 0,
    retried: 0,
    dlq: 0,
  }

  constructor(
    private outboxRepo: OutboxRepository,
    private eventBus: EventBus,
    config?: Partial<OutboxProcessorConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ──────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────

  /** Start polling */
  start(): void {
    if (this.running) return
    this.running = true
    this.intervalId = setInterval(() => this.poll(), this.config.pollIntervalMs)
    console.log(`[OutboxProcessor] Started (poll every ${this.config.pollIntervalMs}ms)`)
  }

  /** Stop polling */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.running = false
    console.log('[OutboxProcessor] Stopped')
  }

  /** Process one batch manually (for testing or cron) */
  async processOnce(): Promise<void> {
    await this.poll()
  }

  // ──────────────────────────────────────────
  // Core Processing Loop
  // ──────────────────────────────────────────

  private async poll(): Promise<void> {
    if (!this.running) return

    try {
      const pending = await this.outboxRepo.getPending(this.config.batchSize)

      for (const outboxEvent of pending) {
        await this.processEvent(outboxEvent)
      }
    } catch (error) {
      console.error('[OutboxProcessor] Poll error:', error)
    }
  }

  private async processEvent(outboxEvent: OutboxEvent): Promise<void> {
    try {
      // Mark as processing
      await this.outboxRepo.markProcessing(outboxEvent.id)

      // Deserialize
      const event = JSON.parse(outboxEvent.payload) as DomainEvent

      // Publish to bus
      await this.eventBus.publish(event)

      // Mark as completed
      await this.outboxRepo.markCompleted(outboxEvent.id)
      this.metrics.processed++
    } catch (error) {
      await this.handleError(outboxEvent, error as Error)
    }
  }

  private async handleError(outboxEvent: OutboxEvent, error: Error): Promise<void> {
    const newRetryCount = outboxEvent.retryCount + 1

    if (newRetryCount >= this.config.maxRetries) {
      // Max retries exceeded → dead letter queue
      await this.outboxRepo.markDeadLetter(outboxEvent.id, error.message)
      this.metrics.dlq++
      console.error(`[OutboxProcessor] Event ${outboxEvent.id} sent to DLQ after ${newRetryCount} retries:`, error.message)
    } else {
      // Calculate next retry time with exponential backoff
      const delay = this.config.baseRetryDelayMs * Math.pow(2, outboxEvent.retryCount)
      const nextRetryAt = new Date(Date.now() + delay)
      await this.outboxRepo.markFailed(outboxEvent.id, error.message, nextRetryAt)
      this.metrics.retried++
      console.warn(`[OutboxProcessor] Event ${outboxEvent.id} failed, retry ${newRetryCount}/${this.config.maxRetries} at ${nextRetryAt.toISOString()}`)
    }

    this.metrics.failed++
  }

  // ──────────────────────────────────────────
  // Metrics
  // ──────────────────────────────────────────

  getMetrics() {
    return { ...this.metrics }
  }
}
