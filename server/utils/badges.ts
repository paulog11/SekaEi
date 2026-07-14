/**
 * @fileoverview Pure badge-eligibility computation — no I/O. The caller
 * (`server/api/badges.get.ts`) gathers the underlying data and this function
 * decides which badge ids the user currently qualifies for.
 */

import { BADGES } from '~/types/badges'
import type { PhonemeDelta } from './updatePhonemeStats'

// Phoneme keys as they actually appear in `phoneme_stats.stats` (ph.Phoneme
// from Azure) are ambiguous: `server/utils/azure.ts` never sets a
// `phonemeAlphabet` on `PronunciationAssessmentConfig`, and Azure's en-US
// default is the SAPI phone set ('th', 'dh'), NOT IPA — while this repo's
// test fixtures (tests/fixtures/mockAssessmentResult.ts, flaggedWords.post
// tests, etc.) use raw IPA symbols ('θ', 'ð'). Since we can't be sure which
// alphabet is actually live in production, each group below lists every
// spelling we know of; `phonemeMastered` sums count/score across whichever
// alias keys are present, so the badge is correct regardless of which
// alphabet Azure hands back.
const PHONEME_L = ['l']
const PHONEME_R = ['r']
const PHONEME_TH_VOICELESS = ['θ', 'th'] // IPA / SAPI, as in "think"
const PHONEME_TH_VOICED = ['ð', 'dh'] // IPA / SAPI, as in "this"

const PHONEME_MASTERY_MIN_ATTEMPTS = 10
const PHONEME_MASTERY_MIN_AVG = 80

export interface BadgeEligibilityData {
  longestStreak: number
  attemptsCount: number
  hasMastery: boolean // any attempt with overall_score >= 90
  phonemeStats: Record<string, { c: number; s: number }> // runtime shape from phoneme_stats.stats
}

function phonemeMastered(stats: PhonemeDelta, aliases: string[]): boolean {
  let c = 0
  let s = 0
  for (const alias of aliases) {
    const entry = stats[alias]
    if (!entry) continue
    c += entry.c
    s += entry.s
  }
  if (c < PHONEME_MASTERY_MIN_ATTEMPTS) return false
  return s / c >= PHONEME_MASTERY_MIN_AVG
}

/**
 * Returns the ids (from `~/types/badges`) the user is currently eligible for,
 * based on the given snapshot of streak/attempt/phoneme data.
 */
export function computeEligibleBadges(data: BadgeEligibilityData): string[] {
  const ids: string[] = []

  if (data.longestStreak >= 3) ids.push('streak-3')
  if (data.longestStreak >= 7) ids.push('streak-7')
  if (data.longestStreak >= 30) ids.push('streak-30')

  if (data.attemptsCount >= 10) ids.push('attempts-10')
  if (data.attemptsCount >= 50) ids.push('attempts-50')
  if (data.attemptsCount >= 100) ids.push('attempts-100')

  if (data.hasMastery) ids.push('first-mastery')

  if (phonemeMastered(data.phonemeStats, PHONEME_L) && phonemeMastered(data.phonemeStats, PHONEME_R)) {
    ids.push('lr-master')
  }

  if (
    phonemeMastered(data.phonemeStats, PHONEME_TH_VOICELESS) &&
    phonemeMastered(data.phonemeStats, PHONEME_TH_VOICED)
  ) {
    ids.push('th-tamer')
  }

  const validIds = new Set(BADGES.map(b => b.id))
  return ids.filter(id => validIds.has(id))
}
