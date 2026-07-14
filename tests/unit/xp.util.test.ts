import { describe, it, expect } from 'vitest'
import { computeXpAward } from '~/server/utils/xp'

describe('computeXpAward', () => {
  it('base tiers by overall score', () => {
    expect(computeXpAward(0, 50).base).toBe(5)
    expect(computeXpAward(59, 50).base).toBe(5)
    expect(computeXpAward(60, 50).base).toBe(10)
    expect(computeXpAward(79, 50).base).toBe(10)
    expect(computeXpAward(80, 50).base).toBe(20)
    expect(computeXpAward(89, 50).base).toBe(20)
    expect(computeXpAward(90, 50).base).toBe(30)
    expect(computeXpAward(100, 50).base).toBe(30)
  })

  it('gives a first-attempt bonus of +10 when priorBest is null', () => {
    const result = computeXpAward(75, null)
    expect(result.base).toBe(10)
    expect(result.bonus).toBe(10)
    expect(result.amount).toBe(20)
  })

  it('gives a mastery bonus of +50 when crossing 90 for the first time', () => {
    const result = computeXpAward(91, 89)
    expect(result.base).toBe(30)
    expect(result.bonus).toBe(50)
    expect(result.amount).toBe(80)
  })

  it('stacks first-attempt and mastery bonuses', () => {
    const result = computeXpAward(95, null)
    expect(result.base).toBe(30)
    expect(result.bonus).toBe(60)
    expect(result.amount).toBe(90)
  })

  it('gives no mastery bonus when priorBest is already >= 90 (idempotent)', () => {
    const result = computeXpAward(95, 90)
    expect(result.bonus).toBe(0)
    expect(result.amount).toBe(30)
  })

  it('gives no mastery bonus when overall is below 90', () => {
    const result = computeXpAward(85, 50)
    expect(result.bonus).toBe(0)
    expect(result.amount).toBe(20)
  })

  it('amount always equals base + bonus', () => {
    const cases: Array<[number, number | null]> = [[0, null], [65, 50], [82, null], [90, 89], [100, 100]]
    for (const [overall, priorBest] of cases) {
      const result = computeXpAward(overall, priorBest)
      expect(result.amount).toBe(result.base + result.bonus)
    }
  })
})
