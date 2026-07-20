import { describe, it, expect } from 'vitest'
import { detectStressedSyllable } from '~/utils/stress'
import type { AzurePhoneme, AzureWord } from '~/types/assessment'
import type { StressChallenge } from '~/types/stress'
import { mockAssessmentResult, mockWord } from '../fixtures/mockAssessmentResult'

const waterChallenge: StressChallenge = {
  id: 'water',
  word: 'water',
  syllables: ['wa', 'ter'],
  stressedIndex: 0,
}

describe('detectStressedSyllable', () => {
  it('syllable path: detects the longer syllable as stressed', () => {
    const word: AzureWord = {
      ...mockWord('water', 90),
      Syllables: [
        { Syllable: 'wa', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 900 },
        { Syllable: 'ter', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 300 },
      ],
    }
    const result = mockAssessmentResult({ Words: [word] })

    expect(detectStressedSyllable(result, waterChallenge)).toEqual({
      detectedIndex: 0,
      correct: true,
      uncertain: false,
    })
  })

  it('syllable path: flags the wrong syllable when durations are reversed', () => {
    const word: AzureWord = {
      ...mockWord('water', 90),
      Syllables: [
        { Syllable: 'wa', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 300 },
        { Syllable: 'ter', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 900 },
      ],
    }
    const result = mockAssessmentResult({ Words: [word] })

    expect(detectStressedSyllable(result, waterChallenge)).toEqual({
      detectedIndex: 1,
      correct: false,
      uncertain: false,
    })
  })

  it('phoneme fallback: buckets phoneme durations by vowel nuclei when no Syllables are present', () => {
    const phonemes: AzurePhoneme[] = [
      { Phoneme: 'w', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 100 },
      { Phoneme: 'aa', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 800 },
      { Phoneme: 't', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 100 },
      { Phoneme: 'er', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 200 },
    ]
    const word = mockWord('water', 90, 'None', phonemes)
    const result = mockAssessmentResult({ Words: [word] })

    expect(detectStressedSyllable(result, waterChallenge)).toEqual({
      detectedIndex: 0,
      correct: true,
      uncertain: false,
    })
  })

  it('returns uncertain when the derived syllable count does not match the challenge', () => {
    const phonemes: AzurePhoneme[] = [
      { Phoneme: 'w', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 100 },
      { Phoneme: 'aa', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 800 },
      { Phoneme: 't', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 100 },
      { Phoneme: 'er', PronunciationAssessment: { AccuracyScore: 90 }, Duration: 200 },
    ]
    const word = mockWord('water', 90, 'None', phonemes) // 2 vowels, but challenge below expects 3 syllables
    const result = mockAssessmentResult({ Words: [word] })
    const mismatchedChallenge: StressChallenge = { ...waterChallenge, syllables: ['wa', 'ter', 'loo'] }

    expect(detectStressedSyllable(result, mismatchedChallenge)).toEqual({
      detectedIndex: -1,
      correct: false,
      uncertain: true,
    })
  })

  it('returns uncertain when there are no words in the result', () => {
    const result = mockAssessmentResult({ Words: [] })

    expect(detectStressedSyllable(result, waterChallenge)).toEqual({
      detectedIndex: -1,
      correct: false,
      uncertain: true,
    })
  })
})
