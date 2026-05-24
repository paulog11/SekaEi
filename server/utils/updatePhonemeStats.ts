/**
 * @fileoverview Pure helper used by the attempts handler to fold one Azure
 * assessment into a per-phoneme count + score-sum delta that gets summed into
 * the user's running phoneme-stats row.
 */

import type { AssessmentResult } from '~/types/assessment'

export interface PhonemeDelta {
  [phoneme: string]: { c: number; s: number } // c = count, s = score_sum
}

/**
 * Walks every phoneme in every word and aggregates per-phoneme attempt count
 * and score sum. The caller adds this delta into the persisted totals.
 */
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
