import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

export interface PhonemeStat {
  phoneme: string
  avgScore: number
  attemptsCount: number
}

const TTL = 10 * 60 * 1000

export const usePhonemeStatsStore = defineStore('phonemeStats', () => {
  const { apiFetch } = useApi()

  const weakest = ref<PhonemeStat[]>([])
  const strongest = ref<PhonemeStat[]>([])
  const fetchedAt = ref<number | null>(null)
  const loading = ref(false)

  function isStale() {
    return fetchedAt.value === null || Date.now() - fetchedAt.value > TTL
  }

  function invalidate() {
    fetchedAt.value = null
  }

  async function fetchStats({ force = false } = {}): Promise<void> {
    if (!force && !isStale()) return
    loading.value = true
    try {
      const data = await apiFetch<{ weakest: PhonemeStat[]; strongest: PhonemeStat[] }>('/api/stats/phonemes')
      weakest.value = data.weakest
      strongest.value = data.strongest
      fetchedAt.value = Date.now()
    } catch {
      // non-fatal
    } finally {
      loading.value = false
    }
  }

  return { weakest, strongest, loading, fetchedAt, isStale, invalidate, fetchStats }
})
