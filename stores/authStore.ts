import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean | null>(null)
  const isApproved = ref<boolean | null>(null)

  function setLoggedIn(value: boolean) {
    isLoggedIn.value = value
    if (!value) isApproved.value = null
  }

  async function refreshApproval() {
    const { apiFetch } = useApi()
    try {
      const data = await apiFetch<{ user: { approvalStatus: string } }>('/api/me')
      isApproved.value = data.user.approvalStatus === 'approved'
    } catch {
      isApproved.value = false
    }
  }

  function reset() {
    isLoggedIn.value = null
    isApproved.value = null
  }

  return { isLoggedIn, isApproved, setLoggedIn, refreshApproval, reset }
})
