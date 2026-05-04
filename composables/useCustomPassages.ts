import { ref } from 'vue'
import { useApi } from './useApi'

export interface CustomPassage {
  id: string
  title: string
  text: string
  ipa?: Record<string, string> | null
  created_at: string
}

export function useCustomPassages() {
  const { apiFetch } = useApi()
  const items = ref<CustomPassage[]>([])
  const loading = ref(false)

  async function fetchPassages(): Promise<void> {
    loading.value = true
    try {
      const data = await apiFetch<{ passages: CustomPassage[] }>('/api/passages')
      items.value = data.passages
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
      return data.passage
    } catch {
      return null
    }
  }

  async function deletePassage(id: string): Promise<void> {
    try {
      await apiFetch(`/api/passages/${id}`, { method: 'DELETE' })
      items.value = items.value.filter(p => p.id !== id)
    } catch {
      // non-fatal
    }
  }

  return { items, loading, fetchPassages, addPassage, deletePassage }
}
