import { ref } from 'vue'
import type { FlaggedWord, FlagWordPayload } from '~/types/flaggedWord'

export function useFlaggedWords() {
  const { apiFetch } = useApi()
  const words = ref<FlaggedWord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const flaggedSet = computed(() => new Set(words.value.map(w => w.word)))

  function isFlagged(displayWord: string): boolean {
    const normalized = displayWord.toLowerCase().replace(/[^a-z']/g, '')
    return flaggedSet.value.has(normalized)
  }

  async function fetchWords(status: 'active' | 'retired' | 'all' = 'active') {
    loading.value = true
    error.value = null
    try {
      const res = await apiFetch<{ words: FlaggedWord[] }>(`/api/flagged-words?status=${status}`)
      words.value = res.words
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load difficult words.'
    } finally {
      loading.value = false
    }
  }

  async function flag(payload: FlagWordPayload): Promise<void> {
    try {
      const res = await apiFetch<{ word: FlaggedWord }>('/api/flagged-words', {
        method: 'POST',
        body: payload,
      })
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

  return { words, loading, error, isFlagged, fetchWords, flag, unflag }
}
