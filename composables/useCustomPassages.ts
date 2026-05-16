import { storeToRefs } from 'pinia'
import { useCustomPassagesStore } from '~/stores/customPassagesStore'

// Re-export type for backwards compatibility
export type { CustomPassage } from '~/stores/customPassagesStore'

export function useCustomPassages() {
  const store = useCustomPassagesStore()
  const { items, loading } = storeToRefs(store)
  return { items, loading, fetchPassages: store.fetchPassages, addPassage: store.addPassage, deletePassage: store.deletePassage }
}
