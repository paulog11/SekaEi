import { describe, it, expect } from 'vitest'
import { SAMPLE_PASSAGES } from '~/types/passages'

describe('SAMPLE_PASSAGES', () => {
  it('has exactly 3 passages', () => {
    expect(SAMPLE_PASSAGES).toHaveLength(3)
  })

  it('all passages have non-empty required fields', () => {
    for (const p of SAMPLE_PASSAGES) {
      expect(p.id.trim(), `${p.id} — id`).not.toBe('')
      expect(p.title.trim(), `${p.id} — title`).not.toBe('')
      expect(p.source.trim(), `${p.id} — source`).not.toBe('')
      expect(p.text.trim(), `${p.id} — text`).not.toBe('')
    }
  })

  it('all passage ids are unique', () => {
    const ids = SAMPLE_PASSAGES.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('passage texts are at least 50 characters (not placeholder stubs)', () => {
    for (const p of SAMPLE_PASSAGES) {
      expect(p.text.length, `${p.id} text too short`).toBeGreaterThan(50)
    }
  })

  it('contains the Interstellar passage', () => {
    const p = SAMPLE_PASSAGES.find(p => p.id === 'interstellar')
    expect(p).toBeDefined()
    expect(p!.text).toContain('look up at the sky')
  })

  it('contains the Great Dictator passage', () => {
    const p = SAMPLE_PASSAGES.find(p => p.id === 'great-dictator')
    expect(p).toBeDefined()
    expect(p!.text).toContain('You, the people')
  })

  it('contains the Rocky Balboa passage', () => {
    const p = SAMPLE_PASSAGES.find(p => p.id === 'rocky-balboa')
    expect(p).toBeDefined()
    expect(p!.text).toContain("ain't all sunshine")
  })
})
