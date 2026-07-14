/**
 * @fileoverview Composable facade over `badgesStore`. Exposes the reactive
 * earned-badges list plus a `fetchBadges` action.
 */

import { storeToRefs } from 'pinia'
import { useBadgesStore } from '~/stores/badgesStore'

export function useBadges() {
  const store = useBadgesStore()
  const { earned, loading, error } = storeToRefs(store)
  return { earned, loading, error, fetchBadges: store.fetchBadges }
}
