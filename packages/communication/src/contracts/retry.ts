// @lp/communication — Retry Contract
// Exponential backoff, DLQ, circuit breaker.

export interface RetryPolicy {
  readonly maxAttempts: number
  readonly baseDelayMs: number
  readonly maxDelayMs: number
  readonly backoffMultiplier: number
}

export interface RetryResult {
  readonly shouldRetry: boolean
  readonly delayMs: number
  readonly attempt: number
  readonly reason: string
}

export interface RetryEvaluator {
  evaluate(
    attempt: number,
    error: string,
    policy?: RetryPolicy
  ): RetryResult
}

export interface DeadLetterQueue {
  enqueue(input: {
    notificationId: string
    channel: string
    recipient: string
    error: string
    attempts: number
    payload: Record<string, unknown>
  }): Promise<void>

  dequeue(): Promise<unknown>
  size(): Promise<number>
}
