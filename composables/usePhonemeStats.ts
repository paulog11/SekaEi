/**
 * @fileoverview Composable facade over `phonemeStatsStore`. Exposes the
 * pre-sorted `weakest` / `strongest` derived lists plus a `fetchStats` action.
 */

import { storeToRefs } from 'pinia'
import { usePhonemeStatsStore } from '~/stores/phonemeStatsStore'


export function usePhonemeStats() {
  const store = usePhonemeStatsStore()
  const { weakest, strongest, loading, error } = storeToRefs(store)
  return { weakest, strongest, loading, error, fetchStats: store.fetchStats }
}
