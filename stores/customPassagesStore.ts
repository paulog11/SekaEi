import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

export interface CustomPassage {
  id: string
  title: string
  text: string
  ipa?: Record<string, string> | null
  created_at: string
}

const TTL = 10 * 60 * 1000

export const useCustomPassagesStore = defineStore('customPassages', () => {
  const { apiFetch } = useApi()

  const items = ref<CustomPassage[]>([])
  const fetchedAt = ref<number | null>(null)
  const loading = ref(false)

  function isStale() {
    return fetchedAt.value === null || Date.now() - fetchedAt.value > TTL
  }

  function invalidate() {
    fetchedAt.value = null
  }

  async function fetchPassages({ force = false } = {}): Promise<void> {
    if (!force && !isStale()) return
    loading.value = true
    try {
      const data = await apiFetch<{ passages: CustomPassage[] }>('/api/passages')
      items.value = data.passages
      fetchedAt.value = Date.now()
    } catch {
      // non-fatal
    } finally {
      loading.value = false
    }
  }

  async function addPassage(title: string, text: string): Promise<CustomPassage | null> {
    try {
      const data = await apiFetch<{ passage: CustomPassage }>('/api/passages', {
        method: 'POST',
        body: { title, text },
      })
      items.value = [data.passage, ...items.value]
      fetchedAt.value = Date.now() // in-memory is now current
      return data.passage
    } catch {
      return null
    }
  }

  async function deletePassage(id: string): Promise<void> {
    try {
      await apiFetch(`/api/passages/${id}`, { method: 'DELETE' })
      items.value = items.value.filter(p => p.id !== id)
      fetchedAt.value = Date.now()
    } catch {
      // non-fatal
    }
  }

  return { items, loading, fetchedAt, isStale, invalidate, fetchPassages, addPassage, deletePassage }
})
