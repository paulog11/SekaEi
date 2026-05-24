/**
 * @fileoverview Thin re-export of `customPassagesStore` as a composable so callers
 * get reactive refs (`storeToRefs`) and stable action references in one import.
 */

import { storeToRefs } from 'pinia'
import { useCustomPassagesStore } from '~/stores/customPassagesStore'

export function useCustomPassages() {
  const store = useCustomPassagesStore()
  const { items, loading } = storeToRefs(store)
  return { items, loading, fetchPassages: store.fetchPassages, addPassage: store.addPassage, deletePassage: store.deletePassage }
}
