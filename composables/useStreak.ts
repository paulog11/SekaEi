import { ref } from 'vue'
import { useApi } from './useApi'

export interface StreakData {
  current: number
  longest: number
  goalMinutes: number
  todayMet: boolean
}

export function useStreak() {
  const { apiFetch } = useApi()
  const streak = ref<StreakData>({ current: 0, longest: 0, goalMinutes: 5, todayMet: false })
  const loading = ref(false)

  async function fetchStreak(): Promise<void> {
    loading.value = true
    try {
      const data = await apiFetch<StreakData>('/api/stats/streak')
      streak.value = data
    } catch {
      // non-fatal
    } finally {
      loading.value = false
    }
  }

  async function setGoal(minutes: number): Promise<void> {
    try {
      await apiFetch('/api/stats/goal', { method: 'PUT', body: { minutes } })
      streak.value = { ...streak.value, goalMinutes: minutes }
    } catch {
      // non-fatal
    }
  }

  return { streak, loading, fetchStreak, setGoal }
}
