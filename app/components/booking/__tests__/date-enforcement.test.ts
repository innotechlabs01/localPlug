import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

function getColombiaDate(): Date {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const colombiaMs = utcMs - 5 * 3_600_000
  return new Date(colombiaMs)
}

function getMinDateString(): string {
  const colombiaNow = getColombiaDate()
  colombiaNow.setDate(colombiaNow.getDate() + 15)
  return colombiaNow.toISOString().split('T')[0]
}

function isDateBlocked(dateString: string): boolean {
  const minDateStr = getMinDateString()
  return dateString < minDateStr
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getMinDateString', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
    expect(getMinDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a date 15 calendar days in the future', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
    const minStr = getMinDateString()
    const minDate = new Date(minStr + 'T00:00:00Z')
    const today = new Date('2026-05-15T00:00:00Z')
    const diffMs = minDate.getTime() - today.getTime()
    const diffDays = Math.round(diffMs / 86_400_000)
    expect(diffDays).toBe(15)
  })

  it('recalculates when the current date advances by 1 day', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
    const day1 = getMinDateString()

    vi.setSystemTime(new Date('2026-05-16T12:00:00Z'))
    const day2 = getMinDateString()

    expect(day2).not.toBe(day1)
  })

  it('handles month rollover correctly', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00Z'))
    const result = getMinDateString()
    expect(result).toBe('2026-02-04')
  })

  it('handles year-end rollover correctly', () => {
    vi.setSystemTime(new Date('2026-12-20T12:00:00Z'))
    const result = getMinDateString()
    expect(result).toBe('2027-01-04')
  })
})

describe('isDateBlocked', () => {
  it('blocks dates within the 15-day window', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
    expect(isDateBlocked('2026-05-20')).toBe(true)
    expect(isDateBlocked('2026-05-29')).toBe(true)
  })

  it('allows dates on or after the minimum date', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
    expect(isDateBlocked('2026-05-30')).toBe(false)
    expect(isDateBlocked('2026-06-01')).toBe(false)
  })

  it('blocks dates in the past', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
    expect(isDateBlocked('2026-05-14')).toBe(true)
    expect(isDateBlocked('2025-01-01')).toBe(true)
  })
})
