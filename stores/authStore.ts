import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean | null>(null)
  const isApproved = ref<boolean | null>(null)

  function setLoggedIn(value: boolean) {
    isLoggedIn.value = value
    if (!value) isApproved.value = null
  }

  async function refreshApproval(userId: string) {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', userId)
      .single() as { data: { approval_status?: string } | null; error: unknown }
    isApproved.value = !error && data?.approval_status === 'approved'
  }

  function reset() {
    isLoggedIn.value = null
    isApproved.value = null
  }

  return { isLoggedIn, isApproved, setLoggedIn, refreshApproval, reset }
})
