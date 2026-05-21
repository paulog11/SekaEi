import { describe, it, expect } from 'vitest'
import { passageStars, customPassageId } from '~/composables/useProgress'
import type { AttemptRecord } from '~/composables/useHistory'

function makeAttempt(overall: number): AttemptRecord {
  return {
    passageId: 'test',
    passageTitle: 'Test',
    timestamp: Date.now(),
    scores: { accuracy: overall, fluency: overall, completeness: overall, overall },
  }
}

describe('passageStars', () => {
  it('returns 0 for an empty attempts array', () => {
    expect(passageStars([])).toBe(0)
  })

  it('returns 3 stars when best score is 90 or above', () => {
    expect(passageStars([makeAttempt(90)])).toBe(3)
    expect(passageStars([makeAttempt(100)])).toBe(3)
  })

  it('returns 2 stars when best score is 80–89', () => {
    expect(passageStars([makeAttempt(80)])).toBe(2)
    expect(passageStars([makeAttempt(89)])).toBe(2)
  })

  it('returns 1 star when best score is 60–79', () => {
    expect(passageStars([makeAttempt(60)])).toBe(1)
    expect(passageStars([makeAttempt(79)])).toBe(1)
  })

  it('returns 0 stars when best score is below 60', () => {
    expect(passageStars([makeAttempt(59)])).toBe(0)
    expect(passageStars([makeAttempt(0)])).toBe(0)
  })

  it('uses the best score across multiple attempts', () => {
    expect(passageStars([makeAttempt(55), makeAttempt(85), makeAttempt(70)])).toBe(2)
  })
})

describe('customPassageId', () => {
  it('prefixes with "custom:"', () => {
    expect(customPassageId('Hello world')).toMatch(/^custom:/)
  })

  it('slugifies the text', () => {
    expect(customPassageId('Hello World')).toBe('custom:hello-world')
  })

  it('strips non-alphanumeric characters', () => {
    expect(customPassageId('It\'s great!')).toBe('custom:its-great')
  })

  it('truncates to the first 80 characters before slugifying', () => {
    const text = 'a'.repeat(100)
    const id = customPassageId(text)
    // 80 'a' chars → 'custom:' + 'a'.repeat(80)
    expect(id).toBe('custom:' + 'a'.repeat(80))
  })

  it('trims leading/trailing whitespace before slugifying', () => {
    expect(customPassageId('  hello  ')).toBe('custom:hello')
  })

  it('collapses multiple spaces into a single hyphen', () => {
    expect(customPassageId('hello   world')).toBe('custom:hello-world')
  })
})
