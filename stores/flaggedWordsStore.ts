import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FlaggedWord, FlagWordPayload } from '~/types/flaggedWord'
import { useApi } from '~/composables/useApi'

const TTL = 5 * 60 * 1000

export const useFlaggedWordsStore = defineStore('flaggedWords', () => {
  const { apiFetch } = useApi()

  const words = ref<FlaggedWord[]>([])
  const fetchedAt = ref<number | null>(null)
  const lastStatus = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const flaggedSet = computed(() => new Set(words.value.map(w => w.word)))

  function isFlagged(displayWord: string): boolean {
    const normalized = displayWord.toLowerCase().replace(/[^a-z']/g, '')
    return flaggedSet.value.has(normalized)
  }

  function isStale(status: string) {
    if (lastStatus.value !== status) return true
    return fetchedAt.value === null || Date.now() - fetchedAt.value > TTL
  }

  function invalidate() {
    fetchedAt.value = null
  }

  async function fetchWords(status: 'active' | 'retired' | 'all' = 'active', { force = false } = {}): Promise<void> {
    if (!force && !isStale(status)) return
    loading.value = true
    error.value = null
    try {
      const res = await apiFetch<{ words: FlaggedWord[] }>(`/api/flagged-words?status=${status}`)
      words.value = res.words
      fetchedAt.value = Date.now()
      lastStatus.value = status
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load difficult words.'
    } finally {
      loading.value = false
    }
  }

  async function flag(payload: FlagWordPayload): Promise<void> {
    // Mark stale so the next fetchWords re-validates (e.g. picks up server-side retirement)
    invalidate()
    try {
      const res = await apiFetch<{ word: FlaggedWord }>('/api/flagged-words', {
        method: 'POST',
        body: payload,
      })
      // Optimistic update for immediate UI feedback
      const idx = words.value.findIndex(w => w.word === res.word.word)
      if (idx >= 0) {
        words.value[idx] = res.word
      } else {
        words.value.unshift(res.word)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to flag word.'
    }
  }

  async function unflag(displayWord: string): Promise<void> {
    const normalized = displayWord.toLowerCase().replace(/[^a-z']/g, '')
    try {
      await apiFetch('/api/flagged-words', {
        method: 'DELETE',
        body: { word: normalized },
      })
      words.value = words.value.filter(w => w.word !== normalized)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to unflag word.'
    }
  }

  return { words, loading, error, fetchedAt, isFlagged, isStale, invalidate, fetchWords, flag, unflag }
})
