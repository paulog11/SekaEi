import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AssessmentResult } from '~/types/assessment'
import { useApi } from '~/composables/useApi'
import { useStreakStore } from '~/stores/streakStore'
import { usePhonemeStatsStore } from '~/stores/phonemeStatsStore'

export interface AttemptRecord {
  id?: string
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

  // Non-reactive per-passage cache — no need to render directly
  const byPassageCache: Record<string, { data: AttemptRecord[]; ts: number }> = {}

  function isStale() {
    return fetchedAt.value === null || Date.now() - fetchedAt.value > TTL
  }

  function invalidate() {
    fetchedAt.value = null
    for (const key in byPassageCache) delete byPassageCache[key]
  }

  async function fetchAll({ force = false } = {}): Promise<AttemptRecord[]> {
    if (!force && !isStale()) return attempts.value
    loading.value = true
    try {
      const res = await apiFetch<{ attempts: AttemptRecord[] }>('/api/attempts')
      attempts.value = res.attempts
      fetchedAt.value = Date.now()
    } catch {
      // non-fatal
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

  async function addAttempt(record: AttemptRecord, azureResult?: AssessmentResult): Promise<void> {
    invalidate()
    // Cascade: history change invalidates derived stats
    useStreakStore().invalidate()
    usePhonemeStatsStore().invalidate()
    try {
      await apiFetch('/api/attempts', {
        method: 'POST',
        body: {
          passageId: record.passageId,
          passageTitle: record.passageTitle,
          scores: record.scores,
          azureResult: azureResult ?? null,
        },
      })
    } catch {
      // Silently degrade — attempt is lost but app continues
    }
  }

  return { attempts, loading, fetchedAt, isStale, invalidate, fetchAll, fetchByPassage, addAttempt }
})
