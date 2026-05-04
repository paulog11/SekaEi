import { ref } from 'vue'
import { useApi } from './useApi'

export interface PhonemeStat {
  phoneme: string
  avgScore: number
  attemptsCount: number
}

export function usePhonemeStats() {
  const { apiFetch } = useApi()
  const weakest = ref<PhonemeStat[]>([])
  const strongest = ref<PhonemeStat[]>([])
  const loading = ref(false)

  async function fetchStats(): Promise<void> {
    loading.value = true
    try {
      const data = await apiFetch<{ weakest: PhonemeStat[]; strongest: PhonemeStat[] }>('/api/stats/phonemes')
      weakest.value = data.weakest
      strongest.value = data.strongest
    } catch {
      // non-fatal
    } finally {
      loading.value = false
    }
  }

  return { weakest, strongest, loading, fetchStats }
}
