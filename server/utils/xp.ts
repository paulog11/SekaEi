/**
 * @fileoverview Pure XP-award calculation. Base XP scales with the attempt's
 * overall score (mirrors the star thresholds in composables/useProgress.ts);
 * bonuses reward a passage's first-ever attempt and its first crossing of
 * the 90 "mastery" threshold.
 */

export interface XpAward {
  base: number
  bonus: number
  amount: number
}

export function computeXpAward(overall: number, priorBestOverall: number | null): XpAward {
  let base: number
  if (overall >= 90) base = 30
  else if (overall >= 80) base = 20
  else if (overall >= 60) base = 10
  else base = 5

  let bonus = 0
  if (priorBestOverall === null) bonus += 10
  if (overall >= 90 && (priorBestOverall === null || priorBestOverall < 90)) bonus += 50

  return { base, bonus, amount: base + bonus }
}
