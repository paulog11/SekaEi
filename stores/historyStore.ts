/**
 * @fileoverview Attempt history cache (5 min TTL) with a separate per-passage
 * sub-cache. `addAttempt` cascades invalidation to `streakStore` and
 * `phonemeStatsStore` because both are derived from attempt data — without
 * the cascade those stores would show stale numbers after a new attempt.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AssessmentResult } from '~/types/assessment'
import { useApi } from '~/composables/useApi'
import { useStreakStore } from '~/stores/streakStore'
import { usePhonemeStatsStore } from '~/stores/phonemeStatsStore'
import { useXpStore } from '~/stores/xpStore'
import type { XpAwardPayload } from '~/stores/xpStore'

export interface AttemptRecord {
  slug?: string
  passageId: string
  passageTitle: string
  timestamp: number
  scores: {
    accuracy: number
    fluency: number
    completeness: number
    prosody?: number
    overall: number
  }
}

const TTL = 5 * 60 * 1000

export const useHistoryStore = defineStore('history', () => {
  const { apiFetch } = useApi()

  const attempts = ref<AttemptRecord[]>([])
  const fetchedAt = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Non-reactive per-passage cache — no need to render directly
  const byPassageCache: Record<string, { data: AttemptRecord[]; ts: number }> = {}

  function isStale() {
    return fetchedAt.value === null || Date.now() - fetchedAt.value > TTL
  }

  function invalidate() {
    fetchedAt.value = null
    for (const key in byPassageCache) delete byPassageCache[key]
  }

  function reset() {
    attempts.value = []
    fetchedAt.value = null
    loading.value = false
    error.value = null
    for (const key in byPassageCache) delete byPassageCache[key]
  }

  async function fetchAll({ force = false } = {}): Promise<AttemptRecord[]> {
    if (!force && !isStale()) return attempts.value
    loading.value = true
    try {
      const res = await apiFetch<{ attempts: AttemptRecord[] }>('/api/attempts')
      attempts.value = res.attempts
      fetchedAt.value = Date.now()
      error.value = null
    } catch (e) {
      error.value = (e as { data?: { message?: string } })?.data?.message ?? "Couldn't load your sessions."
    } finally {
      loading.value = false
    }
    return attempts.value
  }

  async function fetchByPassage(passageId: string, { force = false } = {}): Promise<AttemptRecord[]> {
    const hit = byPassageCache[passageId]
    if (!force && hit && Date.now() - hit.ts < TTL) return hit.data
    try {
      const res = await apiFetch<{ attempts: AttemptRecord[] }>(`/api/attempts?passageId=${encodeURIComponent(passageId)}`)
      byPassageCache[passageId] = { data: res.attempts, ts: Date.now() }
      return res.attempts
    } catch {
      return []
    }
  }

  async function addAttempt(record: AttemptRecord, azureResult?: AssessmentResult): Promise<string | null> {
    invalidate()
    // Cascade: history change invalidates derived stats
    useStreakStore().invalidate()
    usePhonemeStatsStore().invalidate()
    try {
      const res = await apiFetch<{ attempt: { slug: string }; xp: XpAwardPayload | null }>('/api/attempts', {
        method: 'POST',
        body: {
          passageId: record.passageId,
          passageTitle: record.passageTitle,
          scores: record.scores,
          azureResult: azureResult ?? null,
        },
      })
      useXpStore().applyAward(res.xp)
      return res.attempt?.slug ?? null
    } catch {
      // Silently degrade — attempt is lost but app continues
      return null
    }
  }

  return { attempts, loading, error, fetchedAt, isStale, invalidate, reset, fetchAll, fetchByPassage, addAttempt }
})
