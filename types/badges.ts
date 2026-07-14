/**
 * @fileoverview Static badge registry. No award logic here — eligibility is
 * computed elsewhere (server/utils/badges.ts) and persisted to `user_badges`.
 */

export interface BadgeDef {
  id: string
  name: string
  description: string
  emoji: string
}

export const BADGES: BadgeDef[] = [
  { id: 'streak-3', name: '3-Day Streak', description: 'Practiced 3 days in a row.', emoji: '🔥' },
  { id: 'streak-7', name: 'One Week Strong', description: 'Practiced 7 days in a row.', emoji: '⚡' },
  { id: 'streak-30', name: 'Habit Formed', description: 'Practiced 30 days in a row.', emoji: '🏆' },
  { id: 'attempts-10', name: 'Getting Started', description: 'Completed 10 practice attempts.', emoji: '🌱' },
  { id: 'attempts-50', name: 'Practice Makes Perfect', description: 'Completed 50 practice attempts.', emoji: '💪' },
  { id: 'attempts-100', name: 'Centurion', description: 'Completed 100 practice attempts.', emoji: '💯' },
  { id: 'first-mastery', name: 'First Mastery', description: 'Scored 90 or above on a passage for the first time.', emoji: '🌟' },
  { id: 'lr-master', name: 'L/R Master', description: 'Mastered the /l/ and /r/ sounds.', emoji: '🎯' },
  { id: 'th-tamer', name: 'TH Tamer', description: 'Mastered the /θ/ and /ð/ sounds.', emoji: '👅' },
]
