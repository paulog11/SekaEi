/**
 * @fileoverview XP total cache (5 min TTL, same pattern as `streakStore`).
 * `historyStore.addAttempt` applies the authoritative XP award from the
 * `/api/attempts` response via `applyAward` — no refetch needed. `lastAward`
 * is transient state consumed by the practice page (later workstream) to
 * drive the "+N XP" toast / level-up modal.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { levelForXp, levelProgress } from '~/types/levels'

export interface XpAwardPayload {
  awarded: number
  bonus: number
  total: number
  level: number
  leveledUp: boolean
}

const TTL = 5 * 60 * 1000

export const useXpStore = defineStore('xp', () => {
  const { apiFetch } = useApi()

  const total = ref(0)
  const fetchedAt = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastAward = ref<XpAwardPayload | null>(null)

  const level = computed(() => levelForXp(total.value))
  const progress = computed(() => levelProgress(total.value))

  function isStale() {
    return fetchedAt.value === null || Date.now() - fetchedAt.value > TTL
  }

  function invalidate() {
    fetchedAt.value = null
  }

  function reset() {
    total.value = 0
    fetchedAt.value = null
    loading.value = false
    error.value = null
    lastAward.value = null
  }

  async function fetchXp({ force = false } = {}): Promise<void> {
    if (!force && !isStale()) return
    loading.value = true
    try {
      const data = await apiFetch<{ total: number }>('/api/stats/xp')
      total.value = data.total
      fetchedAt.value = Date.now()
      error.value = null
    } catch (e) {
      error.value = (e as { data?: { message?: string } })?.data?.message ?? "Couldn't load your XP."
    } finally {
      loading.value = false
    }
  }

  function applyAward(xp: XpAwardPayload | null): void {
    if (!xp) return
    total.value = xp.total
    fetchedAt.value = Date.now()
    lastAward.value = xp
  }

  function consumeLastAward(): XpAwardPayload | null {
    const award = lastAward.value
    lastAward.value = null
    return award
  }

  return {
    total,
    fetchedAt,
    loading,
    error,
    lastAward,
    level,
    progress,
    isStale,
    invalidate,
    reset,
    fetchXp,
    applyAward,
    consumeLastAward,
  }
})
