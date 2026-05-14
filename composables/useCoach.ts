import { ref } from 'vue'
import type { CoachReply } from '~/types/flaggedWord'

export function useCoach() {
  const { apiFetch } = useApi()
  const result = ref<CoachReply | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function requestCoach(): Promise<void> {
    if (loading.value) return
    loading.value = true
    error.value = null
    try {
      result.value = await apiFetch<CoachReply>('/api/coach', { method: 'POST' })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Coaching service unavailable.'
    } finally {
      loading.value = false
    }
  }

  return { result, loading, error, requestCoach }
}
