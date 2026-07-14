import { describe, it, expect } from 'vitest'
import { computeEligibleBadges, type BadgeEligibilityData } from '~/server/utils/badges'
import { BADGES } from '~/types/badges'

const BASE: BadgeEligibilityData = {
  longestStreak: 0,
  attemptsCount: 0,
  hasMastery: false,
  phonemeStats: {},
}

const VALID_IDS = new Set(BADGES.map(b => b.id))

describe('computeEligibleBadges', () => {
  describe('streak badges', () => {
    it('does not award streak-3 at longestStreak 2', () => {
      expect(computeEligibleBadges({ ...BASE, longestStreak: 2 })).not.toContain('streak-3')
    })
    it('awards streak-3 at longestStreak 3', () => {
      expect(computeEligibleBadges({ ...BASE, longestStreak: 3 })).toContain('streak-3')
    })
    it('does not award streak-7 at longestStreak 6', () => {
      expect(computeEligibleBadges({ ...BASE, longestStreak: 6 })).not.toContain('streak-7')
    })
    it('awards streak-7 at longestStreak 7', () => {
      expect(computeEligibleBadges({ ...BASE, longestStreak: 7 })).toContain('streak-7')
    })
    it('does not award streak-30 at longestStreak 29', () => {
      expect(computeEligibleBadges({ ...BASE, longestStreak: 29 })).not.toContain('streak-30')
    })
    it('awards streak-30 at longestStreak 30', () => {
      expect(computeEligibleBadges({ ...BASE, longestStreak: 30 })).toContain('streak-30')
    })
    it('awards all three streak badges at longestStreak 30', () => {
      const ids = computeEligibleBadges({ ...BASE, longestStreak: 30 })
      expect(ids).toEqual(expect.arrayContaining(['streak-3', 'streak-7', 'streak-30']))
    })
  })

  describe('attempts badges', () => {
    it('does not award attempts-10 at 9 attempts', () => {
      expect(computeEligibleBadges({ ...BASE, attemptsCount: 9 })).not.toContain('attempts-10')
    })
    it('awards attempts-10 at 10 attempts', () => {
      expect(computeEligibleBadges({ ...BASE, attemptsCount: 10 })).toContain('attempts-10')
    })
    it('does not award attempts-50 at 49 attempts', () => {
      expect(computeEligibleBadges({ ...BASE, attemptsCount: 49 })).not.toContain('attempts-50')
    })
    it('awards attempts-50 at 50 attempts', () => {
      expect(computeEligibleBadges({ ...BASE, attemptsCount: 50 })).toContain('attempts-50')
    })
    it('does not award attempts-100 at 99 attempts', () => {
      expect(computeEligibleBadges({ ...BASE, attemptsCount: 99 })).not.toContain('attempts-100')
    })
    it('awards attempts-100 at 100 attempts', () => {
      expect(computeEligibleBadges({ ...BASE, attemptsCount: 100 })).toContain('attempts-100')
    })
  })

  describe('first-mastery badge', () => {
    it('does not award first-mastery when hasMastery is false', () => {
      expect(computeEligibleBadges({ ...BASE, hasMastery: false })).not.toContain('first-mastery')
    })
    it('awards first-mastery when hasMastery is true', () => {
      expect(computeEligibleBadges({ ...BASE, hasMastery: true })).toContain('first-mastery')
    })
  })

  describe('lr-master badge', () => {
    it('does not award when only /l/ meets the threshold (r missing)', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: { l: { c: 20, s: 20 * 90 } },
      })
      expect(ids).not.toContain('lr-master')
    })

    it('does not award when only /r/ meets the threshold (l missing)', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: { r: { c: 20, s: 20 * 90 } },
      })
      expect(ids).not.toContain('lr-master')
    })

    it('does not award when both present but /l/ has too few attempts (<10)', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          l: { c: 9, s: 9 * 90 },
          r: { c: 20, s: 20 * 90 },
        },
      })
      expect(ids).not.toContain('lr-master')
    })

    it('does not award when both present but /r/ avg is below 80', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          l: { c: 20, s: 20 * 90 },
          r: { c: 20, s: 20 * 79 },
        },
      })
      expect(ids).not.toContain('lr-master')
    })

    it('awards lr-master when both /l/ and /r/ have >=10 attempts and >=80 avg', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          l: { c: 10, s: 10 * 80 },
          r: { c: 15, s: 15 * 85 },
        },
      })
      expect(ids).toContain('lr-master')
    })
  })

  describe('th-tamer badge', () => {
    it('does not award when only θ (voiceless) meets the threshold', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: { 'θ': { c: 20, s: 20 * 90 } },
      })
      expect(ids).not.toContain('th-tamer')
    })

    it('does not award when only ð (voiced) meets the threshold', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: { 'ð': { c: 20, s: 20 * 90 } },
      })
      expect(ids).not.toContain('th-tamer')
    })

    it('awards th-tamer when both θ and ð have >=10 attempts and >=80 avg', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          'θ': { c: 10, s: 10 * 80 },
          'ð': { c: 12, s: 12 * 82 },
        },
      })
      expect(ids).toContain('th-tamer')
    })

    it('awards th-tamer with pure SAPI keys (th, dh)', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          th: { c: 10, s: 10 * 80 },
          dh: { c: 12, s: 12 * 82 },
        },
      })
      expect(ids).toContain('th-tamer')
    })

    it('awards th-tamer with a mixed alphabet set (θ + dh)', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          'θ': { c: 10, s: 10 * 80 },
          dh: { c: 12, s: 12 * 82 },
        },
      })
      expect(ids).toContain('th-tamer')
    })

    it('sums counts/scores across aliases for the same sound (θ + th combined meet threshold)', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          'θ': { c: 6, s: 6 * 80 },
          th: { c: 5, s: 5 * 85 },
          'ð': { c: 10, s: 10 * 80 },
        },
      })
      // combined voiceless: c=11, s=480+425=905, avg=905/11≈82.3 >= 80
      expect(ids).toContain('th-tamer')
    })

    it('does not award when combined alias average falls below 80', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          'θ': { c: 6, s: 6 * 80 }, // 480
          th: { c: 5, s: 5 * 60 }, // 300 -> combined c=11, s=780, avg≈70.9
          'ð': { c: 10, s: 10 * 80 },
        },
      })
      expect(ids).not.toContain('th-tamer')
    })

    it('still requires both voiceless and voiced sound mastered even with aliases', () => {
      const ids = computeEligibleBadges({
        ...BASE,
        phonemeStats: {
          th: { c: 10, s: 10 * 90 },
          'θ': { c: 5, s: 5 * 90 },
          // no voiced ('ð'/'dh') entry at all
        },
      })
      expect(ids).not.toContain('th-tamer')
    })
  })

  describe('empty phoneme stats', () => {
    it('awards no phoneme badges when phonemeStats is empty', () => {
      const ids = computeEligibleBadges({ ...BASE, longestStreak: 30, attemptsCount: 100, hasMastery: true })
      expect(ids).not.toContain('lr-master')
      expect(ids).not.toContain('th-tamer')
    })
  })

  describe('id integrity', () => {
    it('every returned id exists in the BADGES registry', () => {
      const ids = computeEligibleBadges({
        longestStreak: 30,
        attemptsCount: 100,
        hasMastery: true,
        phonemeStats: {
          l: { c: 10, s: 10 * 80 },
          r: { c: 10, s: 10 * 80 },
          'θ': { c: 10, s: 10 * 80 },
          'ð': { c: 10, s: 10 * 80 },
        },
      })
      expect(ids.length).toBeGreaterThan(0)
      for (const id of ids) expect(VALID_IDS.has(id)).toBe(true)
    })

    it('returns an empty array for a brand-new user', () => {
      expect(computeEligibleBadges(BASE)).toEqual([])
    })
  })
})
