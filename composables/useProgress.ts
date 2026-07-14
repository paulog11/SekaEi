/**
 * @fileoverview Pure helpers for the progress page: star-rating thresholds
 * and the deterministic id for a user-supplied custom passage.
 */

import type { AttemptRecord } from './useHistory'
import type { LevelDef } from '~/types/levels'

export type StarRating = 0 | 1 | 2 | 3

/**
 * Star rating for a passage from its attempt history. Uses the best overall
 * score across attempts: ≥90 = 3, ≥80 = 2, ≥60 = 1, otherwise 0.
 */
export function passageStars(attempts: AttemptRecord[]): StarRating {
  if (!attempts.length) return 0
  const best = Math.max(...attempts.map(a => a.scores.overall))
  if (best >= 90) return 3
  if (best >= 80) return 2
  if (best >= 60) return 1
  return 0
}

/**
 * True when every passage in the level has been starred at least once
 * (best overall >= 60) in the given attempts — earns the level's passport stamp.
 */
export function levelStampEarned(level: LevelDef, attempts: AttemptRecord[]): boolean {
  return level.passageIds.every(id => passageStars(attempts.filter(a => a.passageId === id)) >= 1)
}

/**
 * Stable, slugified id for a user-supplied passage, derived from the first
 * 80 chars so two identical passages collide and share history.
 */
export function customPassageId(text: string): string {
  return 'custom:' + text.trim().slice(0, 80).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
