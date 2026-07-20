/**
 * @fileoverview Duration-based word-stress grader. English stress is carried
 * acoustically by duration — the stressed syllable's vowel is longer than
 * its neighbors. Given an Azure Pronunciation Assessment result and the
 * `StressChallenge` being graded, `detectStressedSyllable` picks the
 * longest-duration syllable as the one the user stressed.
 *
 * Azure may or may not return a per-syllable breakdown, so there are two
 * paths: a preferred syllable-level path (`AzureWord.Syllables`), and a
 * phoneme-level fallback that buckets phoneme durations by vowel nuclei.
 * The vowel set used to find those nuclei is the calibration knob — see
 * `isVowelPhoneme` below.
 */

import type { AssessmentResult, AzureWord } from '~/types/assessment'
import type { StressChallenge } from '~/types/stress'

export interface StressVerdict {
  detectedIndex: number // 0-based syllable index detected as stressed; -1 when undetectable
  correct: boolean // detectedIndex === challenge.stressedIndex
  uncertain: boolean // true when no reliable signal — caller shows accuracy-only fallback
}

// CALIBRATION: Azure's phoneme alphabet for en-US is confirmed by a live spike (Phase 0).
// Until then this vowel set is a defensive superset of SAPI (Microsoft) and IPA vowels.
// Prune/extend after inspecting a real assessment payload.
const SAPI_VOWELS = new Set([
  'aa', 'ae', 'ah', 'ao', 'aw', 'ax', 'ay', 'eh', 'er', 'ey', 'ih', 'iy', 'ow', 'oy', 'uh', 'uw',
])
const VOWEL_LETTERS = 'aeiouɑæʌɔʊɛɪəɜɝɒ'

function isVowelPhoneme(symbol: string): boolean {
  const cleaned = symbol.toLowerCase().replace(/[0-2:ː]+$/, '')
  return SAPI_VOWELS.has(cleaned) || VOWEL_LETTERS.includes(cleaned.charAt(0))
}

function pickWord(result: AssessmentResult, challenge: StressChallenge): AzureWord | undefined {
  const target = challenge.word.toLowerCase()
  const exactMatch = result.Words.find(
    w =>
      w.Word.toLowerCase() === target &&
      w.PronunciationAssessment.ErrorType !== 'Omission' &&
      w.PronunciationAssessment.ErrorType !== 'Insertion',
  )
  return exactMatch ?? result.Words.find(w => w.Phonemes.length > 0)
}

function syllablePathDurations(word: AzureWord, syllableCount: number): number[] | null {
  const syllables = word.Syllables
  if (!syllables || syllables.length !== syllableCount) return null
  if (!syllables.every(s => typeof s.Duration === 'number')) return null
  return syllables.map(s => s.Duration as number)
}

// Buckets phoneme durations by vowel nuclei: each vowel opens a new syllable
// bucket; consonants before the first vowel fold into bucket 0, consonants
// after a vowel accumulate into the current (most recent vowel's) bucket.
function phonemeFallbackDurations(word: AzureWord, syllableCount: number): number[] | null {
  const buckets: number[] = []
  let pending = 0
  for (const ph of word.Phonemes) {
    const duration = ph.Duration ?? 0
    if (isVowelPhoneme(ph.Phoneme)) {
      buckets.push(pending + duration)
      pending = 0
    } else if (buckets.length === 0) {
      pending += duration
    } else {
      buckets[buckets.length - 1] += duration
    }
  }
  return buckets.length === syllableCount ? buckets : null
}

export function detectStressedSyllable(
  result: AssessmentResult,
  challenge: StressChallenge,
): StressVerdict {
  const word = pickWord(result, challenge)
  if (!word) return { detectedIndex: -1, correct: false, uncertain: true }

  const syllableCount = challenge.syllables.length
  const durations =
    syllablePathDurations(word, syllableCount) ?? phonemeFallbackDurations(word, syllableCount)
  if (!durations) return { detectedIndex: -1, correct: false, uncertain: true }

  let detectedIndex = 0
  for (let i = 1; i < durations.length; i++) {
    if (durations[i] > durations[detectedIndex]) detectedIndex = i
  }

  return { detectedIndex, correct: detectedIndex === challenge.stressedIndex, uncertain: false }
}
