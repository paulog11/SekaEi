import { describe, it, expect } from 'vitest'
import { LEVELS, levelForXp, levelProgress } from '~/types/levels'
import { SAMPLE_PASSAGES } from '~/types/passages'

describe('LEVELS', () => {
  it('every sample-passage id appears in exactly one level', () => {
    const allLevelIds = LEVELS.flatMap(l => l.passageIds)
    for (const p of SAMPLE_PASSAGES) {
      const count = allLevelIds.filter(id => id === p.id).length
      expect(count, `${p.id} should appear exactly once`).toBe(1)
    }
  })

  it('has no passageId that is not in SAMPLE_PASSAGES', () => {
    const sampleIds = new Set(SAMPLE_PASSAGES.map(p => p.id))
    const allLevelIds = LEVELS.flatMap(l => l.passageIds)
    for (const id of allLevelIds) {
      expect(sampleIds.has(id), `${id} not found in SAMPLE_PASSAGES`).toBe(true)
    }
  })

  it('accounts for all 37 sample passages exactly once total', () => {
    const allLevelIds = LEVELS.flatMap(l => l.passageIds)
    expect(allLevelIds.length).toBe(SAMPLE_PASSAGES.length)
    expect(new Set(allLevelIds).size).toBe(allLevelIds.length)
  })

  it('xpThresholds are strictly increasing starting at 0', () => {
    expect(LEVELS[0].xpThreshold).toBe(0)
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xpThreshold).toBeGreaterThan(LEVELS[i - 1].xpThreshold)
    }
  })

  it('level numbers are contiguous starting at 1', () => {
    LEVELS.forEach((l, i) => {
      expect(l.level).toBe(i + 1)
    })
  })
})

describe('levelForXp', () => {
  it('returns level 1 at 0 xp', () => {
    expect(levelForXp(0).level).toBe(1)
  })

  it('returns level 1 at 149 xp (just under level 2 threshold)', () => {
    expect(levelForXp(149).level).toBe(1)
  })

  it('returns level 2 at exactly 150 xp', () => {
    expect(levelForXp(150).level).toBe(2)
  })

  it('returns level 7 at 3999 xp (just under level 8 threshold)', () => {
    expect(levelForXp(3999).level).toBe(7)
  })

  it('returns level 8 at exactly 4000 xp', () => {
    expect(levelForXp(4000).level).toBe(8)
  })

  it('returns level 8 for very large xp totals', () => {
    expect(levelForXp(999999).level).toBe(8)
  })

  it('clamps negative totals to level 1', () => {
    expect(levelForXp(-100).level).toBe(1)
  })
})

describe('levelProgress', () => {
  it('returns nextThreshold null and span 0 at max level', () => {
    const progress = levelProgress(4000)
    expect(progress.level.level).toBe(8)
    expect(progress.nextThreshold).toBeNull()
    expect(progress.span).toBe(0)
  })

  it('computes intoLevel and span for a mid-journey total', () => {
    const progress = levelProgress(200)
    expect(progress.level.level).toBe(2)
    expect(progress.nextThreshold).toBe(400)
    expect(progress.intoLevel).toBe(50)
    expect(progress.span).toBe(250)
  })
})
