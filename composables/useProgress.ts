import type { AttemptRecord } from './useHistory'

export type StarRating = 0 | 1 | 2 | 3

export function passageStars(attempts: AttemptRecord[]): StarRating {
  if (!attempts.length) return 0
  const best = Math.max(...attempts.map(a => a.scores.overall))
  if (best >= 90) return 3
  if (best >= 80) return 2
  if (best >= 60) return 1
  return 0
}

export function customPassageId(text: string): string {
  // Stable id from first 80 chars of trimmed text, slugified
  return 'custom:' + text.trim().slice(0, 80).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
