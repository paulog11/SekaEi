/**
 * @fileoverview Earned-badges cache (10 min TTL, same pattern as
 * `phonemeStatsStore`). `GET /api/badges` both computes and lazily awards
 * badges server-side, so a fetch here can surface newly-earned badges too.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

export interface EarnedBadge {
  id: string
  earnedAt: string
}

const TTL = 10 * 60 * 1000

export const useBadgesStore = defineStore('badges', () => {
  const { apiFetch } = useApi()

  const earned = ref<EarnedBadge[]>([])
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
    earned.value = []
    fetchedAt.value = null
    loading.value = false
    error.value = null
  }

  async function fetchBadges({ force = false } = {}): Promise<void> {
    if (!force && !isStale()) return
    loading.value = true
    try {
      const data = await apiFetch<{ badges: EarnedBadge[] }>('/api/badges')
      earned.value = data.badges
      fetchedAt.value = Date.now()
      error.value = null
    } catch (e) {
      error.value = (e as { data?: { message?: string } })?.data?.message ?? "Couldn't load badges."
    } finally {
      loading.value = false
    }
  }

  return { earned, loading, error, fetchedAt, isStale, invalidate, reset, fetchBadges }
})
