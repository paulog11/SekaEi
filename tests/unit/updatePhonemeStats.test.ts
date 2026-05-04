import { describe, it, expect } from 'vitest'
import { extractPhonemeUpserts } from '~/server/utils/updatePhonemeStats'
import { mockAssessmentResult } from '../fixtures/mockAssessmentResult'

const USER_ID = '00000000-0000-0000-0000-000000000001'

describe('extractPhonemeUpserts', () => {
  it('returns one entry per unique phoneme', () => {
    const result = mockAssessmentResult()
    const upserts = extractPhonemeUpserts(USER_ID, result)

    const phonemes = upserts.map(u => u.phoneme)
    expect(new Set(phonemes).size).toBe(phonemes.length)
  })

  it('each upsert has user_id set correctly', () => {
    const upserts = extractPhonemeUpserts(USER_ID, mockAssessmentResult())
    expect(upserts.every(u => u.user_id === USER_ID)).toBe(true)
  })

  it('sums counts and scores across words for same phoneme', () => {
    const result = mockAssessmentResult()
    const upserts = extractPhonemeUpserts(USER_ID, result)

    for (const u of upserts) {
      expect(u.attempts_count).toBeGreaterThan(0)
      expect(u.score_sum).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns empty array for empty Words', () => {
    const result = { ...mockAssessmentResult(), Words: [] }
    const upserts = extractPhonemeUpserts(USER_ID, result)
    expect(upserts).toHaveLength(0)
  })
})
