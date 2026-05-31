// lib/moderation/comment-filter.ts

const PROFANITY_LIST_EN = [
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'crap', 'dick', 'hell', 'stupid',
  'idiot', 'moron', 'loser', 'suck', 'hate', 'ugly',
]

const PROFANITY_LIST_ES = [
  'mierda', 'puta', 'pendejo', 'pendeja', 'imbecil', 'estupido', 'estupida',
  'idiota', 'basura', 'asco', 'carajo', 'joder', 'maldito', 'maldita',
  'gilipollas', 'capullo', 'cabron', 'cabrona', 'pelotudo', 'pelotuda',
]

const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/i
const SPAM_REPEAT_REGEX = /(.)\1{4,}/
const SPAM_CAPS_BLOCK_REGEX = /[A-Z\s]{20,}/

export interface ModerationResult {
  isClean: boolean
  filteredComment: string
}

export function filterComment(comment: string): ModerationResult {
  if (!comment || !comment.trim()) {
    return { isClean: true, filteredComment: '' }
  }

  const lower = comment.toLowerCase()

  // Check for URLs
  if (URL_REGEX.test(comment)) {
    return { isClean: false, filteredComment: '' }
  }

  // Check for spam patterns
  if (SPAM_REPEAT_REGEX.test(comment)) {
    return { isClean: false, filteredComment: '' }
  }
  if (SPAM_CAPS_BLOCK_REGEX.test(comment)) {
    return { isClean: false, filteredComment: '' }
  }

  // Check profanity
  const hasProfanity = PROFANITY_LIST_EN.some(w => lower.includes(w)) ||
    PROFANITY_LIST_ES.some(w => lower.includes(w))

  if (hasProfanity) {
    return { isClean: false, filteredComment: '' }
  }

  return { isClean: true, filteredComment: comment.trim() }
}
