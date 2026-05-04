import { describe, it, expect } from 'vitest'
import { computeStreak } from '~/server/utils/updateStreak'

const today = new Date('2024-06-15T12:00:00Z')

describe('computeStreak', () => {
  it('starts streak at 1 on first ever practice', () => {
    const result = computeStreak(today, null, 0, 0)
    expect(result).toEqual({ current_streak: 1, longest_streak: 1, last_practice_date: '2024-06-15' })
  })

  it('no-ops when already practiced today', () => {
    const result = computeStreak(today, '2024-06-15', 5, 10)
    expect(result).toEqual({ current_streak: 5, longest_streak: 10, last_practice_date: '2024-06-15' })
  })

  it('increments streak when practice is on consecutive day', () => {
    const result = computeStreak(today, '2024-06-14', 3, 5)
    expect(result.current_streak).toBe(4)
    expect(result.last_practice_date).toBe('2024-06-15')
  })

  it('resets streak to 1 when gap is more than 1 day', () => {
    const result = computeStreak(today, '2024-06-10', 7, 7)
    expect(result.current_streak).toBe(1)
  })

  it('updates longest_streak when new streak exceeds previous best', () => {
    const result = computeStreak(today, '2024-06-14', 9, 9)
    expect(result.current_streak).toBe(10)
    expect(result.longest_streak).toBe(10)
  })

  it('keeps longest_streak when current streak is lower', () => {
    const result = computeStreak(today, '2024-06-14', 2, 15)
    expect(result.current_streak).toBe(3)
    expect(result.longest_streak).toBe(15)
  })
})
