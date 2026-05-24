/**
 * @fileoverview Auth state store. `isLoggedIn` and `isApproved` are tri-state
 * (`null | true | false`) — `null` means "not yet checked" so guards can wait
 * for hydration before redirecting. Approval is fetched via `/api/me`, not by
 * a direct Supabase query, so the value matches what server handlers see.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import type { Tier } from '~/server/utils/tierLimits'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean | null>(null)
  const isApproved = ref<boolean | null>(null)
  const tier = ref<Tier>('public')

  /** Sets login state. On logout (`false`), clears approval and tier so guards see a clean state. */
  function setLoggedIn(value: boolean) {
    isLoggedIn.value = value
    if (!value) {
      isApproved.value = null
      tier.value = 'public'
    }
  }

  /**
   * Re-checks approval + tier from `/api/me`. On any error, conservatively
   * marks the user as unapproved with the lowest tier — guards then redirect
   * to `/pending` rather than letting through a stale `true`.
   */
  async function refreshApproval() {
    const { apiFetch } = useApi()
    try {
      const data = await apiFetch<{ user: { approvalStatus: string; tier: Tier } }>('/api/me')
      isApproved.value = data.user.approvalStatus === 'approved'
      tier.value = data.user.tier ?? 'public'
    } catch {
      isApproved.value = false
      tier.value = 'public'
    }
  }

  function reset() {
    isLoggedIn.value = null
    isApproved.value = null
    tier.value = 'public'
  }

  return { isLoggedIn, isApproved, tier, setLoggedIn, refreshApproval, reset }
})
