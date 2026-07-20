// @lp/communication — Communication Runtime Kernel
// Orchestrates the full pipeline: event → handler → preferences → template → route → deliver

import type { DomainEvent } from '@lp/events'
import type { CommunicationProvider, Channel } from './contracts/provider'
import type { CommunicationHandler, NotificationIntent } from './contracts/handler'
import type { CommunicationRouter } from './contracts/router'
import type { CommunicationTemplate } from './contracts/template'
import type { DeliveryTracker } from './contracts/delivery'
import type { PreferenceResolver } from './contracts/preferences'
import type { RetryEvaluator } from './contracts/retry'
import type { CommunicationMetrics } from './contracts/metrics'

export interface RuntimeConfig {
  readonly enableAutoValidation: boolean
  readonly defaultRetryPolicy: {
    readonly maxAttempts: number
    readonly baseDelayMs: number
    readonly maxDelayMs: number
    readonly backoffMultiplier: number
  }
}

const DEFAULT_CONFIG: RuntimeConfig = {
  enableAutoValidation: true,
  defaultRetryPolicy: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  },
}

export class CommunicationRuntime {
  private handlers = new Map<string, CommunicationHandler>()
  private providers = new Map<Channel, CommunicationProvider>()
  private templates = new Map<string, CommunicationTemplate>()
  private warnings: string[] = []

  constructor(
    private readonly router: CommunicationRouter,
    private readonly preferences: PreferenceResolver,
    private readonly delivery: DeliveryTracker,
    private readonly retry: RetryEvaluator,
    private readonly metrics: CommunicationMetrics,
    private readonly config: RuntimeConfig = DEFAULT_CONFIG
  ) {}

  // ── Registration ──────────────────────────────────────────

  registerHandler(handler: CommunicationHandler): void {
    this.handlers.set(handler.eventType, handler)
  }

  registerProvider(provider: CommunicationProvider): void {
    this.providers.set(provider.channel, provider)
  }

  registerTemplate(template: CommunicationTemplate): void {
    this.templates.set(template.id, template)
  }

  // ── Auto-Validation ───────────────────────────────────────

  validateCatalog(knownEventTypes: string[]): {
    valid: boolean
    warnings: string[]
    errors: string[]
  } {
    const warnings: string[] = []
    const errors: string[] = []

    for (const eventType of knownEventTypes) {
      if (!this.handlers.has(eventType)) {
        warnings.push(`Event "${eventType}" has no communication handler`)
      }
    }

    for (const [channel] of this.providers) {
      const hasTemplates = [...this.templates.values()].some(t => t.channels.includes(channel))
      if (!hasTemplates) {
        warnings.push(`Channel "${channel}" has no templates registered`)
      }
    }

    this.warnings = warnings
    return {
      valid: errors.length === 0,
      warnings,
      errors,
    }
  }

  // ── Core Pipeline ─────────────────────────────────────────

  async process(event: DomainEvent): Promise<ProcessingResult> {
    const startTime = Date.now()
    const results: DeliveryAttempt[] = []

    // 1. Lookup handler
    const handler = this.handlers.get(event.type)
    if (!handler) {
      return {
        success: false,
        event: event.type,
        error: `No handler registered for "${event.type}"`,
        duration: Date.now() - startTime,
        attempts: [],
      }
    }

    // 2. Build notification intent
    const intent = await handler.handle(event)
    if (!intent) {
      return {
        success: true,
        event: event.type,
        skipped: true,
        reason: 'Handler returned null (no notification needed)',
        duration: Date.now() - startTime,
        attempts: [],
      }
    }

    // 3. Process each recipient
    for (const recipient of intent.recipients) {
      // 3a. Resolve preferences
      const userPrefs = await this.preferences.resolve(recipient)

      // 3b. Check quiet hours (skip if override)
      if (!intent.overridePreferences && this.preferences.isQuietHours(userPrefs)) {
        results.push({
          recipient: recipient.id,
          channel: 'inapp' as Channel,
          status: 'skipped',
          reason: 'Quiet hours',
        })
        continue
      }

      // 3c. Select channels
      const selection = this.router.selectChannels(recipient, event.type, userPrefs.channels)

      // 3d. Deliver to each channel
      for (const channel of selection.channels) {
        const provider = this.providers.get(channel)
        if (!provider) {
          results.push({
            recipient: recipient.id,
            channel,
            status: 'failed',
            reason: `No provider for channel "${channel}"`,
          })
          this.metrics.recordFailed(channel, event.type, 'no_provider')
          continue
        }

        // 3e. Render template
        const template = this.templates.get(intent.templateId)
        if (!template) {
          results.push({
            recipient: recipient.id,
            channel,
            status: 'failed',
            reason: `No template "${intent.templateId}"`,
          })
          this.metrics.recordFailed(channel, event.type, 'no_template')
          continue
        }

        const rendered = template.render(channel, {
          locale: recipient.name ? 'es' : 'en',
          payload: intent.payload,
        })

        // 3f. Send via provider
        const sendStart = Date.now()
        const sendResult = await provider.send({
          channel,
          recipient: this.resolveRecipientAddress(recipient, channel),
          subject: rendered.subject,
          body: rendered.body,
          metadata: rendered.metadata,
        })
        const sendLatency = Date.now() - sendStart

        // 3g. Track delivery
        const deliveryRecord = await this.delivery.recordAttempt({
          notificationId: event.id,
          channel,
          recipient: recipient.id,
          status: sendResult.status,
          provider: provider.name,
          messageId: sendResult.messageId,
          error: sendResult.error,
        })

        // 3h. Record metrics
        this.metrics.recordSent(channel, event.type)
        this.metrics.recordLatency(channel, event.type, sendLatency)

        if (sendResult.success) {
          this.metrics.recordDelivered(channel, event.type)
        } else {
          this.metrics.recordFailed(channel, event.type, sendResult.error || 'unknown')
        }

        results.push({
          recipient: recipient.id,
          channel,
          status: sendResult.success ? 'delivered' : 'failed',
          messageId: sendResult.messageId,
          error: sendResult.error,
          latencyMs: sendLatency,
        })
      }
    }

    const totalDuration = Date.now() - startTime
    const allDelivered = results.every(r => r.status === 'delivered' || r.status === 'skipped')
    const anyFailed = results.some(r => r.status === 'failed')

    return {
      success: allDelivered || (!anyFailed && results.length > 0),
      event: event.type,
      notificationId: event.id,
      duration: totalDuration,
      attempts: results,
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  private resolveRecipientAddress(
    recipient: { id: string; email?: string; phone?: string },
    channel: Channel
  ): string {
    switch (channel) {
      case 'whatsapp':
      case 'sms':
        return recipient.phone || ''
      case 'email':
        return recipient.email || ''
      case 'push':
      case 'websocket':
      case 'inapp':
        return recipient.id
      default:
        return recipient.id
    }
  }
}

// ── Types ───────────────────────────────────────────────────

export interface DeliveryAttempt {
  readonly recipient: string
  readonly channel: Channel
  readonly status: 'delivered' | 'failed' | 'skipped'
  readonly messageId?: string
  readonly error?: string
  readonly reason?: string
  readonly latencyMs?: number
}

export interface ProcessingResult {
  readonly success: boolean
  readonly event: string
  readonly notificationId?: string
  readonly skipped?: boolean
  readonly reason?: string
  readonly error?: string
  readonly duration: number
  readonly attempts: DeliveryAttempt[]
}
