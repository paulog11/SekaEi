import { storeToRefs } from 'pinia'
import { useCustomPassagesStore } from '~/stores/customPassagesStore'

export function useCustomPassages() {
  const store = useCustomPassagesStore()
  const { items, loading } = storeToRefs(store)
  return { items, loading, fetchPassages: store.fetchPassages, addPassage: store.addPassage, deletePassage: store.deletePassage }
}
