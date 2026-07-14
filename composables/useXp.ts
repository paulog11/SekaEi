/**
 * @fileoverview Composable facade over `xpStore`. Exposes the reactive XP
 * total/level/progress plus `fetchXp` and `consumeLastAward` actions.
 */

import { storeToRefs } from 'pinia'
import { useXpStore } from '~/stores/xpStore'

export function useXp() {
  const store = useXpStore()
  const { total, level, progress, lastAward, loading, error } = storeToRefs(store)
  return { total, level, progress, lastAward, loading, error, fetchXp: store.fetchXp, consumeLastAward: store.consumeLastAward }
}
