/**
 * @fileoverview Phoneme-stats cache (10 min TTL). Pre-sorted `weakest` and
 * `strongest` arrays come from the server already filtered (min-3-attempts)
 * and capped (top 10) — see `/api/stats/phonemes`.
 */

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
  const error = ref<string | null>(null)

  function isStale() {
    return fetchedAt.value === null || Date.now() - fetchedAt.value > TTL
  }

  function invalidate() {
    fetchedAt.value = null
  }

  function reset() {
    weakest.value = []
    strongest.value = []
    fetchedAt.value = null
    loading.value = false
    error.value = null
  }

  async function fetchStats({ force = false } = {}): Promise<void> {
    if (!force && !isStale()) return
    loading.value = true
    try {
      const data = await apiFetch<{ weakest: PhonemeStat[]; strongest: PhonemeStat[] }>('/api/stats/phonemes')
      weakest.value = data.weakest
      strongest.value = data.strongest
      fetchedAt.value = Date.now()
      error.value = null
    } catch (e) {
      error.value = (e as { data?: { message?: string } })?.data?.message ?? "Couldn't load phoneme stats."
    } finally {
      loading.value = false
    }
  }

  return { weakest, strongest, loading, error, fetchedAt, isStale, invalidate, reset, fetchStats }
})
