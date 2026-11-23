// Shared date utilities - uses Intl.DateTimeFormat for timezone-safe formatting
// Fix A: Hardcoded to America/Bogota (UTC-5)
// Fix B: Detects browser timezone dynamically via Intl.DateTimeFormat

const DEFAULT_TZ = 'America/Bogota'

// Get the browser's timezone (or fallback to America/Bogota)
function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ
  } catch {
    return DEFAULT_TZ
  }
}

// Get today's date in YYYY-MM-DD format using the local timezone
export function getToday(): string {
  const tz = getBrowserTimezone()
  return new Intl.DateTimeFormat('sv-SE', { timeZone: tz })
    .format(new Date())
}

// Parse an arrival date string (YYYY-MM-DD) safely — avoids UTC shift
export function parseArrivalDate(dateStr: string, timeStr?: string | null): Date {
  if (!dateStr) return new Date(NaN)
  const time = timeStr || '00:00'
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh || 0, mm || 0)
}

// Get date portion from ISO string in local timezone (not UTC)
export function getLocalDatePart(isoStr: string): string {
  if (!isoStr) return ''
  const tz = getBrowserTimezone()
  return new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date(isoStr))
}

// Format date for display: "May 22, 2026"
export function formatDateFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const tz = getBrowserTimezone()
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr))
}

// Format date for display: "May 22"
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const tz = getBrowserTimezone()
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr))
}

// Format date for display: "22 may"
export function formatDateEs(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const tz = getBrowserTimezone()
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr))
}

// Format date + time: "May 22, 2026 2:30 PM"
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const tz = getBrowserTimezone()
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

// Format time only: "14:30"
export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const tz = getBrowserTimezone()
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateStr))
}

// Relative time: "5m ago", "2h ago", "Yesterday", "3 days ago"
export function getTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDateShort(dateStr)
}

// Relative time with i18n support
export function getTimeAgoI18n(dateStr: string | null | undefined, t?: Record<string, string>): string {
  if (!dateStr) return '—'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t?.justNow || 'just now'
  if (mins < 60) return (t?.minutesAgo || '{n}m ago').replace('{n}', String(mins))
  const hours = Math.floor(mins / 60)
  if (hours < 24) return (t?.hoursAgo || '{n}h ago').replace('{n}', String(hours))
  const days = Math.floor(hours / 24)
  if (days < 7) return (t?.daysAgo || '{n}d ago').replace('{n}', String(days))
  return formatDateShort(dateStr)
}

// Format date for WhatsApp messages (server-side uses TZ env, client-side uses browser tz)
export function formatDateWhatsApp(dateStr?: Date | string | null, lang: 'es' | 'en' = 'es'): string {
  const date = dateStr ? new Date(dateStr) : new Date()
  const tz = getBrowserTimezone()
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// Check if a date is today in the local timezone
export function isToday(dateStr: string): boolean {
  return getLocalDatePart(dateStr) === getToday()
}

// Check if a date string matches a YYYY-MM-DD filter (timezone-safe)
export function matchesDateFilter(dateStr: string | null | undefined, filterDate: string): boolean {
  if (!dateStr) return false
  return getLocalDatePart(dateStr) === filterDate
}
