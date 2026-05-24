import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import type { Tier } from '~/server/utils/tierLimits'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean | null>(null)
  const isApproved = ref<boolean | null>(null)
  const tier = ref<Tier>('public')

  function setLoggedIn(value: boolean) {
    isLoggedIn.value = value
    if (!value) {
      isApproved.value = null
      tier.value = 'public'
    }
  }

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
