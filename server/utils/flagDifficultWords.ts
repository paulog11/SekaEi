/**
 * @fileoverview Fire-and-forget background job: after every assessment, scan
 * for mispronounced or low-scoring words (< 60) and upsert them into the
 * learner's flagged-words list. Errors are swallowed so they cannot block the
 * assessment response.
 */

import type { AssessmentResult } from '~/types/assessment'
import type { WeakPhonemeHit } from '~/types/flaggedWord'
import { useSupabase } from './supabase'

export const DIFFICULT_THRESHOLD = 60

/**
 * Canonical form for flagged-word storage: lowercase, strips punctuation
 * except apostrophes. Used as the primary key alongside `user_id`.
 */
export function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, '')
}

function extractWeakPhonemes(word: import('~/types/assessment').AzureWord): WeakPhonemeHit[] {
  const hits: WeakPhonemeHit[] = []
  for (const ph of word.Phonemes) {
    const nbest = ph.PronunciationAssessment.NBestPhonemes
    if (!nbest || nbest.length === 0) continue
    const top = nbest[0]
    if (top.Phoneme !== ph.Phoneme) {
      hits.push({ ph: ph.Phoneme, heard: top.Phoneme, score: Math.round(ph.PronunciationAssessment.AccuracyScore) })
    }
  }
  return hits
}

/**
 * Upserts every difficult word from an assessment into `flagged_words`.
 * Skips `Omission` / `Insertion` errors (only `None` and `Mispronunciation`
 * count). All errors swallowed — never blocks the caller.
 */
export async function flagDifficultWordsSilently(
  db: ReturnType<typeof useSupabase>,
  userId: string,
  result: AssessmentResult,
  passageId: string,
  ipa?: Record<string, string>,
): Promise<void> {
  try {
    const difficultWords = result.Words.filter(
      w => w.PronunciationAssessment.ErrorType === 'None' ||
           w.PronunciationAssessment.ErrorType === 'Mispronunciation'
    ).filter(w => w.PronunciationAssessment.AccuracyScore < DIFFICULT_THRESHOLD)

    for (const word of difficultWords) {
      const normalized = normalizeWord(word.Word)
      if (!normalized) continue
      const weakPhonemes = extractWeakPhonemes(word)
      const ipaKey = normalizeWord(word.Word)
      await db.rpc('upsert_flagged_word', {
        p_user_id:       userId,
        p_word:          normalized,
        p_display_word:  word.Word,
        p_score:         Math.round(word.PronunciationAssessment.AccuracyScore),
        p_source:        'auto',
        p_passage_id:    passageId,
        p_ipa:           ipa?.[ipaKey] ?? null,
        p_weak_phonemes: weakPhonemes.length > 0 ? weakPhonemes : null,
      })
    }
  } catch { /* non-fatal */ }
}
