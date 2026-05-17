import { storeToRefs } from 'pinia'
import { usePhonemeStatsStore } from '~/stores/phonemeStatsStore'


export function usePhonemeStats() {
  const store = usePhonemeStatsStore()
  const { weakest, strongest, loading } = storeToRefs(store)
  return { weakest, strongest, loading, fetchStats: store.fetchStats }
}
