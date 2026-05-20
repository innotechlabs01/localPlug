/**
 * Phone number validation and normalization utilities
 * Supports E.164 format for WhatsApp delivery
 */

/**
 * Validate if a phone number is in valid E.164 format
 * E.164: +[country code][number] (e.g., +573001234567)
 */
export function isValidE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{6,14}$/
  return e164Regex.test(phone)
}

/**
 * Normalize a phone number to E.164 format
 * Handles various input formats:
 * - 3001234567 → +573001234567 (assumes Colombia +57)
 * - 573001234567 → +573001234567
 * - +573001234567 → +573001234567 (already valid)
 * - (300) 123-4567 → +573001234567
 */
export function normalizePhone(phone: string, defaultCountryCode: string = '57'): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // If already has + prefix and is valid E.164
  if (cleaned.startsWith('+') && isValidE164(cleaned)) {
    return cleaned
  }

  // Remove leading + if present for processing
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }

  // If starts with country code (e.g., 573001234567)
  if (cleaned.startsWith(defaultCountryCode) && cleaned.length > 10) {
    return `+${cleaned}`
  }

  // Assume local number, prepend country code
  if (cleaned.length >= 10) {
    return `+${defaultCountryCode}${cleaned}`
  }

  // Too short, return as-is (will fail validation)
  return `+${cleaned}`
}

/**
 * Format phone number for display (masked)
 * +573001234567 → +57 *** *** 4567
 */
export function formatPhoneMasked(phone: string): string {
  if (!phone || phone.length < 8) return phone
  const visible = phone.slice(-4)
  const masked = phone.slice(0, -4).replace(/\d/g, '*')
  return `${masked}${visible}`
}

/**
 * Get country code from E.164 phone number
 * +573001234567 → 57
 */
export function getCountryCode(phone: string): string | null {
  const match = phone.match(/^\+(\d{1,3})/)
  return match ? match[1] : null
}
