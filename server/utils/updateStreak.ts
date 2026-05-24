/**
 * @fileoverview Pure streak-calculation helper. Date math uses `YYYY-MM-DD`
 * strings to dodge timezone / time-of-day drift — callers pass `today` in the
 * timezone the streak should reset on.
 */

export interface StreakResult {
  current_streak: number
  longest_streak: number
  last_practice_date: string
}

/**
 * Computes the new streak after a successful practice today.
 * - No prior history → 1
 * - Already practised today → no change
 * - Last practice was yesterday → +1
 * - Any other gap → reset to 1
 *
 * Always advances `longest_streak` to the new max.
 */
export function computeStreak(
  today: Date,
  lastPracticeDate: string | null,
  currentStreak: number,
  longestStreak: number,
): StreakResult {
  const todayStr = today.toISOString().slice(0, 10)

  if (!lastPracticeDate) {
    return { current_streak: 1, longest_streak: Math.max(longestStreak, 1), last_practice_date: todayStr }
  }

  if (lastPracticeDate === todayStr) {
    // Already practiced today — no change
    return { current_streak: currentStreak, longest_streak: longestStreak, last_practice_date: lastPracticeDate }
  }

  // Compare as date strings to avoid timezone/time-of-day drift
  const todayDate = new Date(todayStr)
  const lastDate = new Date(lastPracticeDate)
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / 86_400_000)

  const newStreak = diffDays === 1 ? currentStreak + 1 : 1
  return {
    current_streak: newStreak,
    longest_streak: Math.max(longestStreak, newStreak),
    last_practice_date: todayStr,
  }
}
