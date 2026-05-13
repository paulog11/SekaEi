import type { AssessmentResult } from '~/types/assessment'

export interface PhonemeDelta {
  [phoneme: string]: { c: number; s: number } // c = count, s = score_sum
}

export function extractPhonemeDelta(result: AssessmentResult): PhonemeDelta {
  const delta: PhonemeDelta = {}

  for (const word of result.Words) {
    for (const ph of word.Phonemes) {
      const key = ph.Phoneme
      const score = ph.PronunciationAssessment.AccuracyScore
      const existing = delta[key] ?? { c: 0, s: 0 }
      delta[key] = { c: existing.c + 1, s: existing.s + score }
    }
  }

  return delta
}
