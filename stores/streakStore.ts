import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

export interface StreakData {
  current: number
  longest: number
  goalMinutes: number
  todayMet: boolean
}

const TTL = 5 * 60 * 1000

export const useStreakStore = defineStore('streak', () => {
  const { apiFetch } = useApi()

  const streak = ref<StreakData>({ current: 0, longest: 0, goalMinutes: 5, todayMet: false })
  const fetchedAt = ref<number | null>(null)
  const loading = ref(false)

  function isStale() {
    return fetchedAt.value === null || Date.now() - fetchedAt.value > TTL
  }

  function invalidate() {
    fetchedAt.value = null
  }

  async function fetchStreak({ force = false } = {}): Promise<void> {
    if (!force && !isStale()) return
    loading.value = true
    try {
      const data = await apiFetch<StreakData>('/api/stats/streak')
      streak.value = data
      fetchedAt.value = Date.now()
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

  return { streak, loading, fetchedAt, isStale, invalidate, fetchStreak, setGoal }
})
