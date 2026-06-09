/**
 * @fileoverview Composable facade over `streakStore`. Exposes the reactive
 * streak summary plus `fetchStreak` and `setGoal` actions.
 */

import { storeToRefs } from 'pinia'
import { useStreakStore } from '~/stores/streakStore'


export function useStreak() {
  const store = useStreakStore()
  const { streak, loading, error } = storeToRefs(store)
  return { streak, loading, error, fetchStreak: store.fetchStreak, setGoal: store.setGoal }
}
