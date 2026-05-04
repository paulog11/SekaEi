import type { AssessmentResult } from '~/types/assessment'

export interface PhonemeUpsert {
  user_id: string
  phoneme: string
  attempts_count: number
  score_sum: number
  last_seen: string
}

export function extractPhonemeUpserts(userId: string, result: AssessmentResult): PhonemeUpsert[] {
  const map = new Map<string, { count: number; sum: number }>()
  const now = new Date().toISOString()

  for (const word of result.Words) {
    for (const ph of word.Phonemes) {
      const key = ph.Phoneme
      const score = ph.PronunciationAssessment.AccuracyScore
      const existing = map.get(key) ?? { count: 0, sum: 0 }
      map.set(key, { count: existing.count + 1, sum: existing.sum + score })
    }
  }

  return Array.from(map.entries()).map(([phoneme, { count, sum }]) => ({
    user_id: userId,
    phoneme,
    attempts_count: count,
    score_sum: sum,
    last_seen: now,
  }))
}
