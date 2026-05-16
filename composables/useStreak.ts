import { storeToRefs } from 'pinia'
import { useStreakStore } from '~/stores/streakStore'

// Re-export type for backwards compatibility
export type { StreakData } from '~/stores/streakStore'

export function useStreak() {
  const store = useStreakStore()
  const { streak, loading } = storeToRefs(store)
  return { streak, loading, fetchStreak: store.fetchStreak, setGoal: store.setGoal }
}
