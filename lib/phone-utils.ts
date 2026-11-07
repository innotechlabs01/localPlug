/**
 * Validates and normalizes a phone number to E.164 format.
 * E.164 format: +[country code][subscriber number including area code]
 * 
 * @param phoneNumber - The phone number to validate and normalize
 * @returns The normalized phone number in E.164 format
 * @throws Error if the phone number is invalid
 */
export function normalizeToE164(phoneNumber: string): string {
  // Remove all non-digit characters except the leading '+'
  // We'll keep the leading '+' if it exists, then remove all other non-digits
  let cleaned = phoneNumber.trim();

  // If the number starts with '+', we keep it and remove all other non-digits
  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.substring(1).replace(/\D/g, '');
    cleaned = '+' + digitsOnly;
  } else {
    // Otherwise, remove all non-digits
    cleaned = cleaned.replace(/\D/g, '');
  }

  // Basic validation: E.164 numbers have a maximum of 15 digits (excluding the '+')
  // and a minimum of 10 digits (though this varies by country, we'll use a reasonable range)
  const digits = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
  if (digits.length < 10 || digits.length > 15) {
    throw new Error(`Invalid phone number: ${phoneNumber}. Must be between 10 and 15 digits.`);
  }

  // Ensure the number starts with '+'
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Validates if a phone number is in valid E.164 format.
 * 
 * @param phoneNumber - The phone number to validate
 * @returns True if the phone number is valid E.164 format, false otherwise
 */
export function isValidE164(phoneNumber: string): boolean {
  try {
    const normalized = normalizeToE164(phoneNumber);
    // Additional check: after normalization, it should still be valid
    const digits = normalized.substring(1);
    return digits.length >= 10 && digits.length <= 15 && /^\d+$/.test(digits);
  } catch {
    return false;
  }
}