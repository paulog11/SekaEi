import { watch } from 'vue'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Wait for session hydration so isLoggedIn moves off null only when the
  // answer is definitive — prevents a false-negative redirect mid-hydration.
  await supabase.auth.getSession()

  authStore.setLoggedIn(!!user.value)
  if (user.value?.id) {
    await authStore.refreshApproval(user.value.id)
  }

  watch(user, async (newUser) => {
    authStore.setLoggedIn(!!newUser)
    if (newUser?.id) {
      await authStore.refreshApproval(newUser.id)
    }
  })
})
