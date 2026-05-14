import { describe, it, expect } from 'vitest'
import { normalizeWord, DIFFICULT_THRESHOLD } from '~/server/utils/flagDifficultWords'
import { mockWord, mockPhoneme } from '~/tests/fixtures/mockAssessmentResult'
import type { AssessmentResult } from '~/types/assessment'

describe('normalizeWord', () => {
  it('lowercases and strips non-letter characters', () => {
    expect(normalizeWord("Don't")).toBe("don't")
    expect(normalizeWord('Hello!')).toBe('hello')
    expect(normalizeWord('WORLD')).toBe('world')
    expect(normalizeWord('it\'s')).toBe("it's")
  })

  it('returns empty string for purely punctuation input', () => {
    expect(normalizeWord('...')).toBe('')
  })
})

describe('DIFFICULT_THRESHOLD', () => {
  it('is 60', () => {
    expect(DIFFICULT_THRESHOLD).toBe(60)
  })
})

describe('word filtering logic', () => {
  const makeResult = (words: ReturnType<typeof mockWord>[]): AssessmentResult => ({
    recognizedText: 'test',
    PronunciationAssessment: { AccuracyScore: 70, FluencyScore: 70, CompletenessScore: 100, PronScore: 70 },
    Words: words,
  })

  it('identifies words below threshold with None error type', () => {
    const words = [
      mockWord('rock', 45, 'None'),
      mockWord('lock', 90, 'None'),
      mockWord('road', 55, 'Mispronunciation'),
    ]
    const difficult = words.filter(
      w => (w.PronunciationAssessment.ErrorType === 'None' || w.PronunciationAssessment.ErrorType === 'Mispronunciation') &&
           w.PronunciationAssessment.AccuracyScore < DIFFICULT_THRESHOLD
    )
    expect(difficult).toHaveLength(2)
    expect(difficult[0].Word).toBe('rock')
    expect(difficult[1].Word).toBe('road')
  })

  it('excludes Omission and Insertion error types', () => {
    const words = [
      mockWord('the', 30, 'Omission'),
      mockWord('a', 20, 'Insertion'),
      mockWord('run', 40, 'None'),
    ]
    const difficult = words.filter(
      w => (w.PronunciationAssessment.ErrorType === 'None' || w.PronunciationAssessment.ErrorType === 'Mispronunciation') &&
           w.PronunciationAssessment.AccuracyScore < DIFFICULT_THRESHOLD
    )
    expect(difficult).toHaveLength(1)
    expect(difficult[0].Word).toBe('run')
  })

  it('handles no difficult words', () => {
    const words = [
      mockWord('perfect', 95, 'None'),
      mockWord('great', 88, 'None'),
    ]
    const difficult = words.filter(
      w => (w.PronunciationAssessment.ErrorType === 'None' || w.PronunciationAssessment.ErrorType === 'Mispronunciation') &&
           w.PronunciationAssessment.AccuracyScore < DIFFICULT_THRESHOLD
    )
    expect(difficult).toHaveLength(0)
  })
})

describe('NBestPhonemes extraction logic', () => {
  it('detects mismatch when NBest top phoneme differs from target', () => {
    const phonemeWithNBest = {
      Phoneme: 'r',
      PronunciationAssessment: {
        AccuracyScore: 45,
        NBestPhonemes: [
          { Phoneme: 'l', Score: 72 },
          { Phoneme: 'r', Score: 45 },
        ],
      },
      Offset: 0,
      Duration: 500000,
    }
    const word = mockWord('rock', 45, 'None', [phonemeWithNBest])
    const hits = word.Phonemes.flatMap(ph => {
      const nbest = ph.PronunciationAssessment.NBestPhonemes
      const top = nbest?.[0]
      if (top && top.Phoneme !== ph.Phoneme) {
        return [{ ph: ph.Phoneme, heard: top.Phoneme, score: Math.round(ph.PronunciationAssessment.AccuracyScore) }]
      }
      return []
    })
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ ph: 'r', heard: 'l', score: 45 })
  })

  it('produces no hits when NBest top matches target', () => {
    const phonemeMatching = {
      Phoneme: 'r',
      PronunciationAssessment: {
        AccuracyScore: 82,
        NBestPhonemes: [{ Phoneme: 'r', Score: 82 }],
      },
    }
    const word = mockWord('rock', 82, 'None', [phonemeMatching])
    const hits = word.Phonemes.flatMap(ph => {
      const nbest = ph.PronunciationAssessment.NBestPhonemes
      const top = nbest?.[0]
      if (top && top.Phoneme !== ph.Phoneme) return [{ ph: ph.Phoneme, heard: top.Phoneme }]
      return []
    })
    expect(hits).toHaveLength(0)
  })
})
