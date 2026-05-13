import { describe, it, expect } from 'vitest'
import { extractPhonemeDelta } from '~/server/utils/updatePhonemeStats'
import { mockAssessmentResult } from '../fixtures/mockAssessmentResult'

describe('extractPhonemeDelta', () => {
  it('returns one key per unique phoneme', () => {
    const delta = extractPhonemeDelta(mockAssessmentResult())
    expect(Object.keys(delta).length).toBeGreaterThan(0)
  })

  it('sums counts and scores across words for same phoneme', () => {
    const delta = extractPhonemeDelta(mockAssessmentResult())
    for (const v of Object.values(delta)) {
      expect(v.c).toBeGreaterThan(0)
      expect(v.s).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns empty object for empty Words', () => {
    const result = { ...mockAssessmentResult(), Words: [] }
    const delta = extractPhonemeDelta(result)
    expect(Object.keys(delta)).toHaveLength(0)
  })
})
