import { describe, it, expect } from 'vitest'
import { filterComment } from '@/lib/moderation/comment-filter'

describe('filterComment', () => {
  it('passes clean text unchanged', () => {
    const result = filterComment('This is a great service!')
    expect(result.isClean).toBe(true)
    expect(result.filteredComment).toBe('This is a great service!')
  })

  it('blocks English profanity', () => {
    const result = filterComment('This is shit')
    expect(result.isClean).toBe(false)
    expect(result.filteredComment).toBe('')
  })

  it('blocks Spanish profanity', () => {
    const result = filterComment('Eres un pendejo')
    expect(result.isClean).toBe(false)
    expect(result.filteredComment).toBe('')
  })

  it('detects URLs', () => {
    const result = filterComment('Check this out https://spam.com')
    expect(result.isClean).toBe(false)
    expect(result.filteredComment).toBe('')
  })

  it('detects www URLs', () => {
    const result = filterComment('Visit www.spam-site.com now')
    expect(result.isClean).toBe(false)
    expect(result.filteredComment).toBe('')
  })

  it('flags repeated characters as spam', () => {
    const result = filterComment('aaaaa')
    expect(result.isClean).toBe(false)
    expect(result.filteredComment).toBe('')
  })

  it('flags excessive caps as spam', () => {
    const result = filterComment('THIS IS A MESSAGE IN ALL CAPS THAT IS VERY LONG')
    expect(result.isClean).toBe(false)
    expect(result.filteredComment).toBe('')
  })

  it('handles empty string', () => {
    const result = filterComment('')
    expect(result.isClean).toBe(true)
    expect(result.filteredComment).toBe('')
  })

  it('handles whitespace-only string', () => {
    const result = filterComment('   ')
    expect(result.isClean).toBe(true)
    expect(result.filteredComment).toBe('')
  })

  it('handles special characters', () => {
    const result = filterComment('¡Hola! ¿Cómo estás? 😊')
    expect(result.isClean).toBe(true)
    expect(result.filteredComment).toBe('¡Hola! ¿Cómo estás? 😊')
  })

  it('detects profanity case-insensitively', () => {
    const result = filterComment('What the FUCK')
    expect(result.isClean).toBe(false)
    expect(result.filteredComment).toBe('')
  })
})
